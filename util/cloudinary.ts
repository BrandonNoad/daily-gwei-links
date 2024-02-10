import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'noad',
    api_key: '815292371267463',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const removeEmojis = (str: string) => {
    return str.replace(/[\u{1F300}-\u{1F6FF}]/gu, '');
};

// Additionally, to include a comma (,) forward slash (/), percent sign (%) or an emoji
// character in a text overlay, you must double-escape the % sign within those codes.
const sanitizeText = (text: string) =>
    [',', '/', '%'].reduce((acc, char) => {
        return acc.replaceAll(char, '');
    }, removeEmojis(text));

const PUBLIC_ID = 'frame_template_v2';

// https://cloudinary.com/documentation/layers#text_layer_options
export const generateImageUrl = async ({
    fontSize = 28,
    fontWeight = 600,
    text
}: {
    fontSize: number;
    fontWeight: number;
    text: string;
}) =>
    cloudinary.url(PUBLIC_ID, {
        transformation: [
            {
                color: '#FFFFFF',
                overlay: {
                    font_family: 'Open Sans',
                    font_size: fontSize,
                    font_weight: fontWeight >= 600 ? 'bold' : 'normal',
                    text: sanitizeText(text)
                },
                width: 700,
                crop: 'fit'
            }
        ]
    });
