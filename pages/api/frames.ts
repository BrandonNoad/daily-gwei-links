import type { NextApiRequest, NextApiResponse } from 'next';
import type { Video } from '../../util/airtable';

import { z } from 'zod';
import { parseISO, format } from 'date-fns';
import Axios from 'axios';

import { fetchLatestVideo } from '../../util/airtable';

const BASE_URL = process.env.BASE_URL ?? 'https://daily-gwei-links.vercel.app';
const OG_IMAGE_API_BASE_URL =
    process.env.OG_IMAGE_API_BASE_URL ?? 'https://util.softwaredeveloper.ninja';

// https://hub.freefarcasterhub.com:3281/v1/userDataByFid?fid=8766&user_data_type=2
// {
//   "data": {
//     "type": "MESSAGE_TYPE_USER_DATA_ADD",
//     "fid": 8766,
//     "timestamp": 73129709,
//     "network": "FARCASTER_NETWORK_MAINNET",
//     "userDataBody": {
//       "type": "USER_DATA_TYPE_DISPLAY",
//       "value": "Brandon Noad 🛡️"
//     }
//   },
//   "hash": "0xa4cb205f0fc9bef698f2feb2e3ff7f9d73db65ea",
//   "hashScheme": "HASH_SCHEME_BLAKE3",
//   "signature": "sVKwmnM/ci624CTYHvKL3X9R3ToyEAW7IOBnV0nCjFXaCjvfEz5RDM6exnVVmwlZ8lA8ocnTgWbUn36DPJEZAw==",
//   "signatureScheme": "SIGNATURE_SCHEME_ED25519",
//   "signer": "0x1cdb93b63792830f278cb74c232ac0179b0bb134ca00cefa9d7e1f1478c88abb"
// }
const userDataByFidBodySchema = z.object({
    data: z.object({
        userDataBody: z.object({
            value: z.string()
        })
    })
});

type FrameDataButton =
    | { action: 'post'; label: string }
    | { action: 'link'; label: string; target: string }
    | { action: 'post_redirect'; label: string };

const getFrameData = async ({
    video,
    frameIdx,
    fid
}: {
    video: Video;
    frameIdx: number | 'title';
    fid: number;
}): Promise<{
    text: string;
    searchParams: URLSearchParams;
    buttons: FrameDataButton[];
}> => {
    if (frameIdx === 'title') {
        return {
            text: `${video.title}\n[${format(parseISO(video.publishedAt), 'MMM d, y')}]`,
            searchParams: new URLSearchParams({
                frame: '0',
                videoId: video.id,
                fid: fid.toString()
            }),
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

    const linkDatum = video.linkData.at(frameIdx);

    if (!linkDatum) {
        let username = '';
        try {
            // https://hub.freefarcasterhub.com:3281 stopped working
            const HUB_BASE_URL = 'https://www.noderpc.xyz/farcaster-mainnet-hub';
            const response = await Axios.get(`${HUB_BASE_URL}/v1/userDataByFid`, {
                params: { fid: fid, user_data_type: 2 }
            });

            const body = userDataByFidBodySchema.parse(response.data);

            username = body.data.userDataBody.value;
        } catch (err) {
            // ignore error
        }

        return {
            text: `Thanks for reading${username !== '' ? ` ${username}` : ''}!`,
            searchParams: new URLSearchParams({
                frame: 'title',
                videoId: video.id
            }),
            buttons: [
                {
                    label: 'Visit Site',
                    action: 'link',
                    target: `${BASE_URL}/recent`
                },
                { label: 'Start Over', action: 'post' }
            ]
        };
    }

    return {
        text:
            linkDatum.text === null
                ? linkDatum.url
                : `${linkDatum.text.before}${linkDatum.text.value}${linkDatum.text.after}`,
        searchParams: new URLSearchParams({
            frame: (frameIdx + 1).toString(),
            videoId: video.id,
            fid: fid.toString()
        }),
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
    buttons: FrameDataButton[];
}) => {
    const buttonsMeta = buttons
        .flatMap((button, idx) => {
            const buttonNumber = idx + 1;

            const tags = [
                `<meta property="fc:frame:button:${buttonNumber}" content="${button.label}" />`,
                `<meta property="fc:frame:button:${buttonNumber}:action" content="${button.action}" />`
            ];

            if (button.action === 'link') {
                tags.push(
                    `<meta property="fc:frame:button:${buttonNumber}:target" content="${button.target}" />`
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
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:post_url" content="${postUrl}" />
          ${buttonsMeta}
      </head>
    </html>`;
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

// Example req.body
// {
//   "untrustedData": {
//     "fid": 2,
//     "url": "https://fcpolls.com/polls/1",
//     "messageHash": "0xd2b1ddc6c88e865a33cb1a565e0058d757042974",
//     "timestamp": 1706243218,
//     "network": 1,
//     "buttonIndex": 2,
//     "inputText": "hello world", // "" if requested and no input, undefined if input not requested
//     "castId": {
//       "fid": 226,
//       "hash": "0xa48dd46161d8e57725f5e26e34ec19c13ff7f3b9"
//     }
//   },
//   "trustedData": {
//     "messageBytes": "d2b1ddc6c88e865a33cb1a565e0058d757042974..."
//   }
// }

const bodySchema = z.object({
    untrustedData: z.object({
        fid: z.number()
    })
});

const searchParamsSchema = z.object({
    frame: z.union([z.enum(['initial', 'title']), z.coerce.number()]).optional(),
    videoId: z.string().optional()
});

// TODO: set maxDuration config?
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

    const bodyParseResult = bodySchema.safeParse(req.body);

    if (!bodyParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const { fid } = bodyParseResult.data.untrustedData;

    const searchParamsParseResult = searchParamsSchema.safeParse(req.query);

    if (!searchParamsParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const frameSearchParam = searchParamsParseResult.data.frame ?? 'title';

    if (frameSearchParam === 'initial') {
        return res.redirect(303, `${BASE_URL}/frame`);
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

    const frameData = await getFrameData({ video, frameIdx, fid });

    const imageUrl = new URL(`${OG_IMAGE_API_BASE_URL}/api/og/image`);
    imageUrl.search = new URLSearchParams({
        template: 'tdg',
        content: JSON.stringify({
            style: { fontSize: frameIdx === 'title' ? 30 : 28, fontWeight: 600 },
            data: [frameData.text]
        })
    }).toString();

    const postUrl = new URL(`${BASE_URL}/api/frames`);
    postUrl.search = frameData.searchParams.toString();

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            generateHtml({
                title: 'The Daily Gwei Refuel Show Notes',
                imageUrl: imageUrl.toString(),
                postUrl: postUrl.toString(),
                buttons: frameData.buttons
            })
        );
};

export default handler;
