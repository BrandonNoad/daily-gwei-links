import { parseISO, format } from 'date-fns';
import { Box, Text, Heading, Link, UnorderedList, ListItem } from '@chakra-ui/react';

import type { Video, LinkDataItem } from '../util/airtable';
import Card from './card';

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
                                {text?.before ?? ''}
                            </Text>
                            <Link
                                color="primary.800"
                                fontWeight="medium"
                                _hover={{ color: 'primary.900', fontWeight: 'medium' }}
                                href={url}
                            >
                                {text?.value ?? url}
                            </Link>
                            <Text as="span" color="neutral.900">
                                {text?.after ?? ''}
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
            <Heading as="h3" size="md" mb={3} color="neutral.900">
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
