import type { NextApiRequest, NextApiResponse } from 'next';

import { ethers } from 'ethers';
import { z } from 'zod';
import { parseISO, format } from 'date-fns';
import Axios from 'axios';

import { fetchVideosByKeyword } from '../../../util/airtable';
import { generateImageUrl } from '../../../util/ogImage';

const PAGE_TITLE = 'The Daily Gwei Refuel Search';
const BASE_URL = process.env.BASE_URL ?? 'https://daily-gwei-links.vercel.app';
const CURRENT_URL = `${BASE_URL}/api/frames/search`;
const HUB_BASE_URL = 'https://www.noderpc.xyz/farcaster-mainnet-hub';
const CONTRACT_ABI = [
    {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
];

const contractAllowlist = [
    // Bankless - The SBF vs. Erik Voorhees Debate
    { address: '0xe60A7e1A1ee79832f8f8042b0CFFB2EaDdb5E6C0' },

    // The Daily Gwei - 1 Year Anniversary NFT
    { address: '0x23294eF5BD5ec2fca40904f7Cd4A48e73781f207' }
];

const ethereumAddressAllowlist: string[] = [];

// {
//   "messages": [
//     {
//       "data": {
//         "type": "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS",
//         "fid": 2,
//         "timestamp": 73244540,
//         "network": "FARCASTER_NETWORK_MAINNET",
//         "verificationAddEthAddressBody": {
//           "address": "0x91031dcfdea024b4d51e775486111d2b2a715871",
//           "ethSignature": "tyxj1...x1cYzhyxw=",
//           "blockHash": "0xd74860c4bbf574d5ad60f03a478a30f990e05ac723e138a5c860cdb3095f4296"
//         }
//       },
//       "hash": "0xa505331746ec8c5110a94bdb098cd964e43a8f2b",
//       "hashScheme": "HASH_SCHEME_BLAKE3",
//       "signature": "bln1zIZM.../4riB9IVBQ==",
//       "signatureScheme": "SIGNATURE_SCHEME_ED25519",
//       "signer": "0x78ff9...b6d62558c"
//     }
//   ],
//   "nextPageToken": ""
// }
const verificationsByFidResponseDataSchema = z.object({
    messages: z.array(
        z.object({
            data: z.object({
                type: z.enum(['MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS']),
                verificationAddEthAddressBody: z.object({
                    address: z.string()
                })
            })
        })
    )
});

type FrameDataButton =
    | { action: 'post'; label: string }
    | { action: 'link'; label: string; target: string }
    | { action: 'post_redirect'; label: string };

const generateHtml = ({
    title,
    imageUrl,
    postUrl,
    buttons = [],
    isTextInput = false
}: {
    title: string;
    imageUrl: string;
    postUrl?: string;
    buttons?: FrameDataButton[];
    isTextInput?: boolean;
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
          ${postUrl ? `<meta property="fc:frame:post_url" content="${postUrl}" />` : ''}
          ${
              isTextInput
                  ? '<meta property="fc:frame:input:text" content="Enter a keyword..." />'
                  : ''
          }
          ${buttonsMeta}
      </head>
    </html>`;
};

const forbidden = async ({ res }: { res: NextApiResponse }) => {
    const imageUrl = await generateImageUrl({
        fontSize: 30,
        fontWeight: 600,
        text: [
            'Sorry, you are not authorized to use this frame!',
            'Click this image to view the list of eligible NFT collections'
        ]
    });

    return res.setHeader('Content-Type', 'text/html').send(
        generateHtml({
            title: PAGE_TITLE,
            imageUrl
        })
    );
};

const noResults = async ({ res, keyword }: { res: NextApiResponse; keyword: string }) => {
    const imageUrl = await generateImageUrl({
        fontSize: 30,
        fontWeight: 600,
        text: [`No results${keyword ? ` for "${keyword}"` : ''}!`, 'Try a different keyword']
    });

    const buttons: FrameDataButton[] = [{ label: 'Search', action: 'post' }];

    const postUrl = new URL(CURRENT_URL);
    postUrl.search = getDefaultSearchParams({ numButtons: buttons.length }).toString();

    return res.setHeader('Content-Type', 'text/html').send(
        generateHtml({
            title: PAGE_TITLE,
            imageUrl,
            postUrl: postUrl.toString(),
            buttons,
            isTextInput: true
        })
    );
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

const untrustedDataSchema = z.object({
    fid: z.number(),
    inputText: z.string().optional(),
    buttonIndex: z.number()
});

const trustedDataSchema = z.object({
    messageBytes: z.string()
});

const bodySchema = z.object({
    untrustedData: untrustedDataSchema,
    trustedData: trustedDataSchema
});

type Body = z.infer<typeof bodySchema>;

const searchParamsSchema = z.object({
    resultIdx: z.coerce.number().optional(),
    keyword: z.string().optional(),
    numButtons: z.coerce.number()
});

// {
//   valid: true,
//   message: {
//     data: {
//       type: 'MESSAGE_TYPE_FRAME_ACTION',
//       fid: 8766,
//       timestamp: 98291496,
//       network: 'FARCASTER_NETWORK_MAINNET',
//       frameActionBody: {
//         url: 'aHR0cHM6Ly83NWJheXZpZXcuc29mdHdhcmVkZXZlbG9wZXIubmluamEvc2VhcmNoL2ZyYW1l',
//         buttonIndex: 1,
//         castId: { fid: 8766, hash: '0x0000000000000000000000000000000000000001' },
//         inputText: ''
//       }
//     },
//     hash: '0xfc1f078543272bb7a437ecc16f6769d96d1b8cde',
//     hashScheme: 'HASH_SCHEME_BLAKE3',
//     signature: 'cR8iDC06v5I9boE11+qaKtYt63HYSUJEtF6INVicoc7GiVr6wnpKnYWLIdaPGh2NinsI4kHnWscMvxXm+W32Bg==',
//     signatureScheme: 'SIGNATURE_SCHEME_ED25519',
//     signer: '0x1cdb93b63792830f278cb74c232ac0179b0bb134ca00cefa9d7e1f1478c88abb'
//   }
// }
const validateMessageResponseDataSchema = z.object({
    valid: z.boolean(),
    message: z.object({
        data: z.object({
            fid: z.number(),
            frameActionBody: z.object({
                buttonIndex: z.number(),
                inputText: z.string().optional()
            })
        })
    })
});

const validateMessage = async ({
    trustedData,
    untrustedData
}: Body): Promise<
    | { success: false }
    | { success: true; data: { fid: number; inputText: string | undefined; buttonIndex: number } }
> => {
    try {
        const { data } = await Axios.post(
            `${HUB_BASE_URL}/v1/validateMessage`,
            Buffer.from(trustedData.messageBytes, 'hex'),
            { headers: { 'Content-Type': 'application/octet-stream' } }
        );

        const { valid, message } = validateMessageResponseDataSchema.parse(data);

        if (!valid) {
            return { success: false };
        }

        return {
            success: true,
            data: {
                fid: message.data.fid,
                // message.data.frameActionBody.inputText is an empty string even if the frame that
                // POSTed the request did not have a text input, which contradicts the following
                // comment from the spec:
                // `"" if requested and no input, undefined if input not requested"`
                inputText:
                    untrustedData.inputText === undefined
                        ? undefined
                        : typeof message.data.frameActionBody.inputText === 'string'
                        ? Buffer.from(message.data.frameActionBody.inputText, 'base64').toString(
                              'utf8'
                          )
                        : undefined,
                buttonIndex: message.data.frameActionBody.buttonIndex
            }
        };
    } catch (err) {
        return { success: false };
    }
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

const getDefaultSearchParams = ({ numButtons }: { numButtons: number }) =>
    new URLSearchParams({ _: Date.now().toString(), numButtons: numButtons.toString() });

const handler = async (req: NextApiRequest, res: NextApiResponse<string | ErrorResponse>) => {
    if (req.method !== 'POST') {
        return res.status(404).json({
            statusCode: 404,
            message: 'Not Found'
        });
    }

    const bodyParseResult = bodySchema.safeParse(req.body);

    if (!bodyParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    // -- Check AuthZ

    const messageDataResult = await validateMessage(bodyParseResult.data);

    if (!messageDataResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const { fid, inputText, buttonIndex } = messageDataResult.data;

    const verificationsByFidResponse = await Axios.get(`${HUB_BASE_URL}/v1/verificationsByFid`, {
        params: { fid: fid }
    });

    const { messages } = verificationsByFidResponseDataSchema.parse(
        verificationsByFidResponse.data
    );

    if (messages.length === 0) {
        return forbidden({ res });
    }

    const ethereumAddress = messages[0].data.verificationAddEthAddressBody.address;

    let isAuthorized = ethereumAddressAllowlist.includes(ethereumAddress);

    if (!isAuthorized) {
        const provider = new ethers.JsonRpcProvider('https://www.noderpc.xyz/rpc-mainnet/public');

        const contracts = contractAllowlist.map(
            ({ address }) => new ethers.Contract(address, CONTRACT_ABI, provider)
        );

        const results = await Promise.all(
            contracts.map((contract) => contract.balanceOf(ethereumAddress))
        );

        isAuthorized = results.some((balance) => {
            const parseResult = z.bigint().safeParse(balance);

            return parseResult.success && parseResult.data > BigInt(0);
        });
    }

    if (!isAuthorized) {
        return forbidden({ res });
    }

    // -- "Start" frame

    if (inputText === undefined) {
        const imageUrl = await generateImageUrl({
            fontSize: 30,
            fontWeight: 600,
            text: ['Search for an episode using the input below', '[Beta]']
        });

        const buttons: FrameDataButton[] = [{ label: 'Search', action: 'post' }];

        const postUrl = new URL(CURRENT_URL);
        postUrl.search = getDefaultSearchParams({ numButtons: buttons.length }).toString();

        return res.setHeader('Content-Type', 'text/html').send(
            generateHtml({
                title: PAGE_TITLE,
                imageUrl,
                postUrl: postUrl.toString(),
                buttons,
                isTextInput: true
            })
        );
    }

    const searchParamsParseResult = searchParamsSchema.safeParse(req.query);

    if (!searchParamsParseResult.success) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    // The "Search" / "New Search" button is always last.
    // `buttonIndex` starts at 1.
    const isNewSearch = buttonIndex === searchParamsParseResult.data.numButtons;

    const prevKeyword = searchParamsParseResult.data.keyword ?? '';

    const resultIdx = isNewSearch ? 0 : searchParamsParseResult.data.resultIdx ?? 0;

    if (!isNewSearch && (!prevKeyword || resultIdx === 0)) {
        return res.status(400).json({
            statusCode: 400,
            message: 'Bad Request'
        });
    }

    const keyword = (isNewSearch ? inputText : prevKeyword).trim().split(' ')[0].toLowerCase();

    const videos = keyword === '' ? [] : await fetchVideosByKeyword(keyword);

    const video = videos.at(resultIdx);

    if (!video) {
        return noResults({ res, keyword });
    }

    const [match, nextMatch] = [video.linkData, videos.at(resultIdx + 1)?.linkData ?? []].map(
        (linkData) =>
            linkData.find(({ text }) => {
                if (text === null) {
                    return false;
                }

                return text.before.toLowerCase().includes(keyword);
            })
    );

    // TODO: for some reason "Superphiz" resulted in an error even though it is included in one of
    // the link descriptions. Investigate why this is happening.

    if (!match) {
        return noResults({ res, keyword });
    }

    let episodeTitle = video.title;

    const regex = /The Daily Gwei Refuel #(\d+)/;
    const titleMatch = video.title.match(regex);

    if (titleMatch) {
        episodeTitle = `The Daily Gwei Refuel #${titleMatch[1]}`;
    }

    const imageUrl = await generateImageUrl({
        fontSize: 28,
        fontWeight: 600,
        text: [
            `${episodeTitle} [${format(parseISO(video.publishedAt), 'MMM d, y')}]`,
            match.text === null
                ? match.url
                : `${match.text.before}${match.text.value}${match.text.after}`
        ]
    });

    const buttons: FrameDataButton[] = [
        {
            label: 'Watch',
            action: 'link',
            target: match.url
        },
        ...match.children
            .slice(0, nextMatch ? 1 : 2)
            .map((child, idx, items): { label: string; action: 'link'; target: string } => ({
                label: `Related Link${items.length > 1 ? ` ${idx + 1}` : ''}`,
                action: 'link',
                target: child.url
            })),
        ...(nextMatch
            ? [
                  {
                      label: 'Next Result',
                      action: 'post'
                  } as FrameDataButton
              ]
            : []),
        { label: 'New Search', action: 'post' }
    ];

    const postUrl = new URL(CURRENT_URL);
    const postUrlSearchParams = getDefaultSearchParams({ numButtons: buttons.length });

    if (nextMatch) {
        postUrlSearchParams.set('keyword', keyword);
        postUrlSearchParams.set('resultIdx', (resultIdx + 1).toString());
    }

    postUrl.search = postUrlSearchParams.toString();

    return res.setHeader('Content-Type', 'text/html').send(
        generateHtml({
            title: PAGE_TITLE,
            imageUrl,
            postUrl: postUrl.toString(),
            buttons,
            isTextInput: true
        })
    );
};

export default handler;
