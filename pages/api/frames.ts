import type { NextApiRequest, NextApiResponse } from 'next';
import type { Video } from '../../util/airtable';

import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';

import { fetchLatestVideo } from '../../util/airtable';

cloudinary.config({
    cloud_name: 'noad',
    api_key: '815292371267463',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const frameSearchParamSchema = z.union([z.enum(['initial', 'title']), z.coerce.number()]);

const getFrameText = ({ video, frameIdx }: { video: Video; frameIdx: number | 'title' }) => {
    if (frameIdx === 'title') {
        return video.title;
    }

    if (frameIdx + 1 > video.linkData.length) {
        return 'Thanks for reading!';
    }

    const linkDatum = video.linkData[frameIdx];

    if (linkDatum.text === null) {
        return linkDatum.url;
    }

    return `${linkDatum.text.before}${linkDatum.text.value}${linkDatum.text.after}`;
};

const getPostUrlFrameSearchParam = ({
    video,
    frameIdx
}: {
    video: Video;
    frameIdx: number | 'title';
}) => {
    if (frameIdx === 'title') {
        return '0';
    }

    if (frameIdx + 1 > video.linkData.length) {
        return 'initial';
    }

    return (frameIdx + 1).toString();
};

const getFrameButtons = ({
    video,
    frameIdx
}: {
    video: Video;
    frameIdx: number | 'title';
}): Array<
    | { action: 'post'; label: string }
    | { action: 'link'; label: string; target: string }
    | { action: 'post_redirect'; label: string }
> => {
    if (frameIdx === 'title') {
        return [
            {
                label: 'Watch',
                action: 'link',
                target: `https://www.youtube.com/watch?v=${video.id}`
            },
            { label: 'Next', action: 'post' }
        ];
    }

    if (frameIdx + 1 > video.linkData.length) {
        return [
            // { label: 'Start Over', action: 'post_redirect' },
            {
                label: 'Visit Site',
                action: 'link',
                target: 'https://daily-gwei-links.vercel.app/recent'
            }
        ];
    }

    const linkDatum = video.linkData[frameIdx];

    return [
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
    ];
};

const getFrameMetaHTML = ({
    title,
    imageUrl,
    postUrl,
    buttons
}: {
    title: string;
    imageUrl: string;
    postUrl: string;
    buttons: ReturnType<typeof getFrameButtons>;
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

    const frame = req.query.frame ?? 'title';

    const parseResult = frameSearchParamSchema.safeParse(frame);

    if (!parseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const frameIdx = parseResult.data;

    if (frameIdx === 'initial') {
        return res.redirect(303, '/frame');
    }

    const CLOUDINARY_PUBLIC_ID = 'frame_template_v2';

    // https://cloudinary.com/documentation/layers#text_layer_options
    const imageUrl = cloudinary.url(CLOUDINARY_PUBLIC_ID, {
        transformation: [
            {
                color: '#FFFFFF',
                overlay: {
                    font_family: 'Open Sans',
                    font_size: frameIdx === 'title' ? 30 : 24,
                    font_weight: 'bold',
                    text: getFrameText({ video, frameIdx })
                },
                width: 700,
                crop: 'fit'
            }
        ]
    });

    const postUrl = new URL('https://daily-gwei-links.vercel.app/api/frames');
    postUrl.searchParams.set('frame', getPostUrlFrameSearchParam({ video, frameIdx }));

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            getFrameMetaHTML({
                title: 'The Daily Gwei Refuel Show Notes',
                imageUrl,
                postUrl: postUrl.toString(),
                buttons: getFrameButtons({ video, frameIdx })
            })
        );
};

export default handler;
