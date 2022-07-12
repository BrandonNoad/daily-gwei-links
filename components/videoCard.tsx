import { parseISO, format } from 'date-fns';
import { Box, Text, Heading, Link, UnorderedList, ListItem } from '@chakra-ui/react';

import type { Video, LinkDataItem } from '../util/airtable';
import Card from './card';

// TODO: re-import the videos and save the before/after link text.
const renderLinks = ({
    linkData = [],
    parentId,
    fallback = null,
    mb = 2.5,
    mt = 0
}: {
    linkData?: LinkDataItem[];
    parentId: string;
    fallback?: JSX.Element | null;
    mb?: number;
    mt?: number;
}) => {
    if (linkData.length === 0) {
        return fallback;
    }

    return (
        <UnorderedList>
            {linkData.map(({ text, url, children }, idx) => {
                const itemId = `${parentId}-${idx}`;

                return (
                    <ListItem key={itemId} mb={mb} mt={mt}>
                        <Box>
                            <Text as="span" color="neutral.900">
                                {text ? text.slice(0, -6) : ''}
                            </Text>
                            <Link
                                color="primary.800"
                                fontWeight="medium"
                                _hover={{ color: 'primary.900', fontWeight: 'medium' }}
                                href={url}
                            >
                                {text ? text.slice(text.length - 6, -1) : url}
                            </Link>
                            <Text as="span" color="neutral.900">
                                {text ? ')' : ''}
                            </Text>
                        </Box>
                        {renderLinks({ linkData: children, parentId: itemId, mb: 0, mt: 0.5 })}
                    </ListItem>
                );
            })}
        </UnorderedList>
    );
};

const VideoCard = ({ id, title, publishedAt, linkData }: Video) => {
    return (
        <Card px={[3, 4, 6]} py={3}>
            <Text fontSize="sm" color="neutral.500" fontWeight="normal" mb={1.5}>
                {format(parseISO(publishedAt), 'MMM d, y')}
            </Text>
            <Heading as="h3" size="md" mb={3} color="supporting.800">
                <Link
                    href={`https://www.youtube.com/watch?v=${id}`}
                    _hover={{ color: 'primary.900' }}
                >
                    {title}
                </Link>
            </Heading>
            {renderLinks({ linkData, parentId: id, fallback: <span>No links today!</span> })}
        </Card>
    );
};

export default VideoCard;
