// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Video } from '../../util/airtable';

import { google, youtube_v3 } from 'googleapis';

import { fetchRecentVideos, addVideos } from '../../util/airtable';
import { groupByMonth } from '../../util';

export type YouTubeVideo = {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
};

type ValidNewItem = {
    id: string;
    snippet: { publishedAt: string; title?: string; description?: string };
};

const isString = (val: string | null | undefined): val is string => typeof val === 'string';

const isValidNewItem = (item: youtube_v3.Schema$Video): item is ValidNewItem =>
    typeof item.id === 'string' && typeof item.snippet?.publishedAt === 'string';

const fetchNewYouTubeVideos = async (latestVideos: Video[]) => {
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
    });

    let newYouTubeVideos: YouTubeVideo[] = [];

    let pageToken: string | undefined;
    let isNextPage: boolean = true;

    while (isNextPage) {
        // As of 2023-12-07, it seems the data is no longer ordered by publishedAt desc.
        const { data: playlistItemsData } = await youtube.playlistItems.list({
            playlistId: 'PLIMWH1uKd3oE905uSUHdE5hd6e2UpADak',
            part: ['contentDetails'],
            maxResults: 50,
            pageToken
        });

        pageToken = playlistItemsData.nextPageToken ?? undefined;
        isNextPage = typeof pageToken === 'string';

        const videoIds = (playlistItemsData.items ?? [])
            .filter(({ contentDetails }) => {
                const videoId = contentDetails?.videoId ?? null;
                const publishedAt = contentDetails?.videoPublishedAt ?? null;

                if (videoId === null || publishedAt === null) {
                    return false;
                }

                return (
                    latestVideos.length === 0 ||
                    (publishedAt >= latestVideos[0].publishedAt &&
                        latestVideos.find((video) => video.id === videoId) === undefined)
                );
            })
            .map(({ contentDetails }) => contentDetails?.videoId)
            .filter(isString);

        if (videoIds.length > 0) {
            const { data: videosData } = await youtube.videos.list({
                part: ['snippet'],
                id: videoIds
            });

            const newItems = videosData.items ?? [];

            const validNewItems: ValidNewItem[] = newItems.filter(isValidNewItem);

            newYouTubeVideos = newYouTubeVideos.concat(
                validNewItems.map(({ id, snippet: { publishedAt, title, description } }) => ({
                    id,
                    title: title ?? '',
                    description: description ?? '',
                    publishedAt
                }))
            );
        }
    }

    return newYouTubeVideos;
};

type SuccessResponse = {
    success: true;
};

type ErrorResponse = {
    statusCode: number;
    message: string;
};

const handler = async (
    req: NextApiRequest,
    res: NextApiResponse<SuccessResponse | ErrorResponse>
) => {
    if (req.method !== 'POST') {
        return res.status(404).json({
            statusCode: 404,
            message: 'Not Found'
        });
    }

    if ((req.headers?.authorization ?? '').slice('Bearer '.length) !== process.env.AUTHN_API_KEY) {
        return res.status(403).json({
            statusCode: 403,
            message: 'Forbidden'
        });
    }

    // From Airtable.
    const recentVideos = await fetchRecentVideos();

    // Assumes recentVideos is sorted by publishedAt desc (but ties may exist).
    const latestVideos = recentVideos.reduce((acc: Video[], video) => {
        if (acc.length === 0) {
            return [video];
        }

        if (video.publishedAt >= acc[0].publishedAt) {
            if (video.publishedAt > acc[0].publishedAt) {
                throw new Error('Bad Implementation!');
            }

            acc.push(video);
            return acc;
        }

        return acc;
    }, []);

    const newYouTubeVideos = await fetchNewYouTubeVideos(latestVideos);

    if (newYouTubeVideos.length > 0) {
        await addVideos(newYouTubeVideos);

        const months = Object.keys(groupByMonth(newYouTubeVideos));

        await Promise.all([
            res.revalidate('/recent'),
            res.revalidate('/frame'),
            res.revalidate('/archives'),
            ...months.map((month) => res.revalidate(`/archives/${month}`))
        ]);
    } else {
        await res.revalidate('/frame');
    }

    return res.status(200).json({ success: true });
};

export default handler;
