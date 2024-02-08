import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: 'noad',
    api_key: '815292371267463',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PUBLIC_ID = 'frame_template_v2';

// https://cloudinary.com/documentation/layers#text_layer_options
export const generateImageUrl = ({ fontSize, text }: { fontSize: number; text: string }) =>
    cloudinary.url(PUBLIC_ID, {
        transformation: [
            {
                color: '#FFFFFF',
                overlay: {
                    font_family: 'Open Sans',
                    font_size: fontSize,
                    font_weight: 'bold',
                    text: text
                },
                width: 700,
                crop: 'fit'
            }
        ]
    });
