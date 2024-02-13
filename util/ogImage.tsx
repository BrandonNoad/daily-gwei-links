import { ImageResponse } from '@vercel/og';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { ImageResponseOptions } from '@vercel/og/dist/types';

const dglLogoDataUrl =
    'data:image/png;base64,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';

type FontWeight = NonNullable<ImageResponseOptions['fonts']>[0]['weight'];

export const generateImageUrl = async ({
    fontSize = 28,
    fontWeight = 400,
    text
}: {
    fontSize: number;
    fontWeight: number;
    text: string | string[];
}) => {
    // const fontsPath = path.join(fileURLToPath(import.meta.url), '..', '..', 'public', 'fonts');

    // const fontMeta = [
    //     { filename: 'OpenSans-SemiBold.ttf', name: 'Open Sans', weight: 600 },
    //     { filename: 'OpenSans-Bold.ttf', name: 'Open Sans', weight: 700 }
    // ];

    // const fonts = await Promise.all(
    //     fontMeta.map(async ({ filename, name, weight }) => ({
    //         name,
    //         weight: weight as FontWeight,
    //         data: await fs.readFile(path.join(fontsPath, filename))
    //     }))
    // );

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'nowrap',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    padding: 40
                }}
            >
                <img
                    src={dglLogoDataUrl}
                    alt="logo"
                    style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40 }}
                />
                {(typeof text === 'string' ? [text] : text).map((str) => (
                    <div
                        key={str}
                        style={{
                            marginBottom: 24,
                            fontSize,
                            fontFamily: 'Open Sans',
                            fontWeight,
                            color: 'white',
                            textAlign: 'center',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {str}
                    </div>
                ))}
            </div>
        ),
        // 1.91:1 aspect ratio
        // Use height: 800 for 1:1 aspect ratio
        // Can pass other satori options here: https://github.com/vercel/satori
        {
            width: 800,
            height: 418
            // fonts
        }
    );
    const imgBuffer = await imageResponse?.arrayBuffer();

    return `data:image/png;base64,${Buffer.from(imgBuffer).toString('base64')}`;
};
