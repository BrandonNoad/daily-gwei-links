import { Video } from './airtable';

export const getPublishedAtMonth = (publishedAt: string) => publishedAt.slice(0, 'YYYY-MM'.length);

type HasPublishedAt = {
    publishedAt: string;
};
export const groupByMonth = (data: HasPublishedAt[]) =>
    data.reduce((acc: { [key: string]: HasPublishedAt[] }, item) => {
        const month = getPublishedAtMonth(item.publishedAt);

        if (acc[month] === undefined) {
            acc[month] = [];
        }

        acc[month].push(item);

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
