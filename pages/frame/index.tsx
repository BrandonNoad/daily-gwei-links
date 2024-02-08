import type { GetStaticProps, NextPage } from 'next';
import type { Video } from '../../util/airtable';

import NextHead from 'next/head';
import { v2 as cloudinary } from 'cloudinary';

import { fetchLatestVideo } from '../../util/airtable';
import VideoList from '../../components/videoList';

export const getStaticProps: GetStaticProps = async () => {
    cloudinary.config({
        cloud_name: 'noad',
        api_key: '815292371267463',
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const latestVideo = await fetchLatestVideo();

    const CLOUDINARY_PUBLIC_ID = 'frame_template_v2';

    const imageUrl = cloudinary.url(CLOUDINARY_PUBLIC_ID, {
        transformation: [
            {
                color: '#FFFFFF',
                overlay: {
                    font_family: 'Open Sans',
                    font_size: 36,
                    font_weight: 'bold',
                    text: 'The Daily Gwei Refuel Show Notes'
                },
                width: 700,
                crop: 'fit'
            }
        ]
    });

    return { props: { title: 'The Daily Gwei Refuel Show Notes', latestVideo, imageUrl } };
};

type Props = {
    title: string;
    latestVideo: Video | null;
    imageUrl: string;
};

const FramePage: NextPage<Props> = ({ title, latestVideo, imageUrl }) => {
    const content = latestVideo ? <VideoList videos={[latestVideo]} /> : <p>No Video!</p>;

    return (
        <>
            <NextHead>
                <meta property="og:title" content={title} />
                <meta property="og:image" content={imageUrl} />
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content={imageUrl} />
                <meta property="fc:frame:button:1" content="Let's get into it!" />
                <meta
                    property="fc:frame:post_url"
                    content="https://daily-gwei-links.vercel.app/api/frames"
                />
            </NextHead>
            {content}
        </>
    );
};

export default FramePage;
