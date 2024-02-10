import type { GetStaticProps, NextPage } from 'next';
import type { Video } from '../../util/airtable';

import NextHead from 'next/head';

import { fetchLatestVideo } from '../../util/airtable';
import { generateImageUrl } from '../../util/ogImage';
import VideoList from '../../components/videoList';

const BASE_URL = process.env.BASE_URL ?? 'https://daily-gwei-links.vercel.app';

export const getStaticProps: GetStaticProps = async () => {
    const latestVideo = await fetchLatestVideo();

    return {
        props: {
            title: 'The Daily Gwei Refuel Show Notes',
            latestVideo,
            imageUrl: await generateImageUrl({
                fontSize: 36,
                fontWeight: 700,
                text: 'The Daily Gwei Refuel Show Notes'
            })
        }
    };
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
                <meta property="fc:frame:post_url" content={`${BASE_URL}/api/frames`} />
            </NextHead>
            {content}
        </>
    );
};

export default FramePage;
