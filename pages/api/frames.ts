import type { NextApiRequest, NextApiResponse } from 'next';
import type { Video } from '../../util/airtable';

import { z } from 'zod';
import { parseISO, format } from 'date-fns';

import { fetchLatestVideo } from '../../util/airtable';
import { generateImageUrl } from '../../util/cloudinary';

const searchParamsSchema = z.object({
    frame: z.union([z.enum(['initial', 'title']), z.coerce.number()]).optional(),
    videoId: z.string().optional()
});

const frameSearchParamSchema = z.union([z.enum(['initial', 'title']), z.coerce.number()]);

const getFrameData = ({
    video,
    frameIdx
}: {
    video: Video;
    frameIdx: number | 'title';
}): {
    text: string;
    searchParams: URLSearchParams;
    buttons: Array<
        | { action: 'post'; label: string }
        | { action: 'link'; label: string; target: string }
        | { action: 'post_redirect'; label: string }
    >;
} => {
    if (frameIdx === 'title') {
        return {
            text: `${video.title} [${format(parseISO(video.publishedAt), 'MMM d, y')}]`,
            searchParams: new URLSearchParams({ frame: '0', videoId: video.id }),
            buttons: [
                {
                    label: 'Watch',
                    action: 'link',
                    target: `https://www.youtube.com/watch?v=${video.id}`
                },
                { label: 'Next', action: 'post' }
            ]
        };
    }

    if (frameIdx + 1 > video.linkData.length) {
        return {
            text: 'Thanks for reading!',
            searchParams: new URLSearchParams({ frame: 'title', videoId: video.id }),
            buttons: [
                { label: 'Start Over', action: 'post' },
                {
                    label: 'Visit Site',
                    action: 'link',
                    target: 'https://daily-gwei-links.vercel.app/recent'
                }
            ]
        };
    }

    const linkDatum = video.linkData[frameIdx];

    return {
        text:
            linkDatum.text === null
                ? linkDatum.url
                : `${linkDatum.text.before}${linkDatum.text.value}${linkDatum.text.after}`,
        searchParams: new URLSearchParams({ frame: (frameIdx + 1).toString(), videoId: video.id }),
        buttons: [
            {
                label: 'Watch',
                action: 'link',
                target: linkDatum.url
            },
            ...linkDatum.children
                .slice(0, 2)
                .map((child, idx, items): { label: string; action: 'link'; target: string } => ({
                    label: `Related Link${items.length > 1 ? ` ${idx + 1}` : ''}`,
                    action: 'link',
                    target: child.url
                })),
            { label: 'Next', action: 'post' }
        ]
    };
};

const generateHtml = ({
    title,
    imageUrl,
    postUrl,
    buttons
}: {
    title: string;
    imageUrl: string;
    postUrl: string;
    buttons: ReturnType<typeof getFrameData>['buttons'];
}) => {
    const buttonsMeta = buttons
        .flatMap((button, idx) => {
            const buttonNumber = idx + 1;

            const tags = [
                `<meta name="fc:frame:button:${buttonNumber}" content="${button.label}" />`,
                `<meta name="fc:frame:button:${buttonNumber}:action" content="${button.action}" />`
            ];

            if (button.action === 'link') {
                tags.push(
                    `<meta name="fc:frame:button:${buttonNumber}:target" content="${button.target}" />`
                );
            }

            return tags;
        })
        .join('');

    return `<!DOCTYPE html>
    <html>
      <head>
          <title>${title}</title>
          <meta property="og:title" content="${title}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta name="fc:frame" content="vNext" />
          <meta name="fc:frame:image" content="${imageUrl}" />
          <meta name="fc:frame:post_url" content="${postUrl}" />
          ${buttonsMeta}
      </head>
    </html>`;
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<string | ErrorResponse>) => {
    if (req.method !== 'POST') {
        return res.status(404).json({
            statusCode: 404,
            message: 'Not Found'
        });
    }

    const video = await fetchLatestVideo();

    if (video === null) {
        return res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error'
        });
    }

    const searchParamsParseResult = searchParamsSchema.safeParse(req.query);

    if (!searchParamsParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const frameSearchParam = searchParamsParseResult.data.frame ?? 'title';

    if (frameSearchParam === 'initial') {
        return res.redirect(303, 'https://daily-gwei-links.vercel.app/frame');
    }

    let frameIdx: number | 'title' = frameSearchParam;

    if (
        typeof searchParamsParseResult.data.videoId === 'string' &&
        searchParamsParseResult.data.videoId !== video.id
    ) {
        // If the video updated while the user was browsing the frame, show the user the title frame
        // for the new video.
        frameIdx = 'title';
    }

    const frameData = getFrameData({ video, frameIdx });

    const imageUrl = generateImageUrl({
        fontSize: frameIdx === 'title' ? 30 : 28,
        text: frameData.text
    });

    const postUrl = new URL('https://daily-gwei-links.vercel.app/api/frames');
    postUrl.search = frameData.searchParams.toString();

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            generateHtml({
                title: 'The Daily Gwei Refuel Show Notes',
                imageUrl,
                postUrl: postUrl.toString(),
                buttons: frameData.buttons
            })
        );
};

export default handler;
