import type { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import type { Video } from '../../util/airtable';

import Error from 'next/error';
import { parseISO } from 'date-fns';

import VideoList from '../../components/videoList';
import { fetchAllVideos } from '../../util/airtable';
import { groupVideosByMonth, getPublishedAtMonth, getMonthHeading } from '../../util';

export const getStaticPaths: GetStaticPaths = async () => {
    const allVideos = await fetchAllVideos();

    const allVideosGroupedByMonth = groupVideosByMonth(allVideos);

    return {
        paths: Object.keys(allVideosGroupedByMonth)
            .sort()
            .reverse()
            .map((month) => ({ params: { month } })),
        fallback: 'blocking'
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const month = params?.month as string;

    if (parseISO(`${month}-01`).toString() === 'Invalid Date') {
        return { props: { error: { statusCode: 404, message: 'Not Found' } } };
    }

    const allVideos = await fetchAllVideos();

    const videosForMonth = allVideos.filter((video) => getPublishedAtMonth(video) === month);

    return { props: { title: `Archives - ${getMonthHeading(month)}`, videos: videosForMonth } };
};

type Props =
    | { title: string; videos: Video[] }
    | { error: { statusCode: number; message: string } };

const ArchivedVideos: NextPage<Props> = (props) => {
    if ('error' in props) {
        const { statusCode, message } = props.error;

        return <Error statusCode={statusCode} title={message} />;
    }

    return <VideoList videos={props.videos} />;
};

export default ArchivedVideos;
