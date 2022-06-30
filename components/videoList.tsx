import type { Video } from '../util/airtable';

import { List, ListItem } from '@chakra-ui/react';

import VideoCard from './videoCard';

type Props = {
    videos: Video[];
};

const VideoList = ({ videos }: Props) => {
    return (
        <List>
            {videos.map((video) => (
                <ListItem key={video.id} mb={2.5}>
                    <VideoCard {...video} />
                </ListItem>
            ))}
        </List>
    );
};

export default VideoList;
