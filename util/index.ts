import { Video } from './airtable';

export const getPublishedAtMonth = (video: Video) => video.publishedAt.slice(0, 'YYYY-MM'.length);

export const groupVideosByMonth = (videos: Video[]) =>
    videos.reduce((acc: { [key: string]: Video[] }, video) => {
        const month = getPublishedAtMonth(video);

        if (acc[month] === undefined) {
            acc[month] = [];
        }

        acc[month].push(video);

        return acc;
    }, {});

const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

export const getMonthHeading = (month: string) => {
    const [year, monthString] = month.split('-');

    return `${monthNames[+monthString - 1]} ${year}`;
};
