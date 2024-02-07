import type { NextApiRequest, NextApiResponse } from 'next';

const getFrameMetaHTML = ({
    title,
    imageUrl,
    postUrl,
    buttons
}: {
    title: string;
    imageUrl: string;
    postUrl: string;
    buttons: string[];
}) => {
    const buttonsMeta = buttons
        .map((button, idx) => `<meta name="fc:frame:button:${idx + 1}" content="${button}" />`)
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

    return res
        .setHeader('Content-Type', 'text/html')
        .status(200)
        .send(
            getFrameMetaHTML({
                title: 'Test',
                imageUrl:
                    'https://res.cloudinary.com/noad/image/upload/f_auto,q_auto/cap_hr9yu9.png',
                postUrl: 'https://daily-gwei-links.vercel.app/api/frames',
                buttons: ['Button 1', 'Button 2']
            })
        );
};

export default handler;
