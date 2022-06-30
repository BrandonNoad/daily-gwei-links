import type { GetStaticProps, NextPage } from 'next';
import type { Video } from '../../util/airtable';

import { fetchRecentVideos } from '../../util/airtable';
import VideoList from '../../components/videoList';

export const getStaticProps: GetStaticProps = async () => {
    const recentVideos = await fetchRecentVideos();

    return { props: { recentVideos } };
};

type Props = {
    recentVideos: Video[];
};

const RecentVideosPage: NextPage<Props> = ({ recentVideos }) => {
    return <VideoList videos={recentVideos} />;
};

export default RecentVideosPage;
