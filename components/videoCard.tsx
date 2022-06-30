import { parseISO, format } from 'date-fns';
import { Box, Text, Heading, Link, UnorderedList, ListItem } from '@chakra-ui/react';

import type { Video, LinkDataItem } from '../util/airtable';
import Card from './card';

const renderLinks = ({
    linkData = [],
    parentId,
    fallback = null
}: {
    linkData?: LinkDataItem[];
    parentId: string;
    fallback?: JSX.Element | null;
}) => {
    if (linkData.length === 0) {
        return fallback;
    }

    return (
        <UnorderedList>
            {linkData.map(({ text, url, children }, idx) => {
                const itemId = `${parentId}-${idx}`;

                return (
                    <ListItem key={itemId}>
                        <Box mb={1}>
                            <Link
                                color="gray.800"
                                fontWeight="medium"
                                _hover={{ color: 'cyan.700' }}
                                href={url}
                            >
                                {text || url}
                            </Link>
                        </Box>
                        {renderLinks({ linkData: children, parentId: itemId })}
                    </ListItem>
                );
            })}
        </UnorderedList>
    );
};

const VideoCard = ({ id, title, publishedAt, linkData }: Video) => {
    return (
        <Card px={6} py={3}>
            <Text fontSize="sm" color="gray.500" fontWeight="normal" mb={1.5}>
                {format(parseISO(publishedAt), 'MMM d, y')}
            </Text>
            <Heading as="h3" size="md" mb={2.5} color="purple.700">
                <Link
                    href={`https://www.youtube.com/watch?v=${id}`}
                    _hover={{ color: 'purple.800' }}
                >
                    {title}
                </Link>
            </Heading>
            {renderLinks({ linkData, parentId: id, fallback: <span>No Links!</span> })}
        </Card>
    );
};

export default VideoCard;
