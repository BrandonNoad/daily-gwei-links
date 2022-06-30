import type { GetStaticProps, NextPage } from 'next';

import { SimpleGrid, Box, Text } from '@chakra-ui/react';

import InternalLink from '../../components/internalLink';
import { fetchAllVideos } from '../../util/airtable';
import { groupVideosByMonth, getMonthHeading } from '../../util';
import Card from '../../components/card';

export const getStaticProps: GetStaticProps = async () => {
    const allVideos = await fetchAllVideos();

    const allVideosGroupedByMonth = groupVideosByMonth(allVideos);

    return {
        props: {
            months: Object.keys(allVideosGroupedByMonth).sort().reverse()
        }
    };
};

type Props = {
    months: string[];
};

const ArchivesIndexPage: NextPage<Props> = ({ months }) => {
    return (
        <Card px={24} py={10}>
            <SimpleGrid columns={[2, null, 3]} spacingX={6} spacingY={4} justifyItems="center">
                {months.map((month) => (
                    <Box key={month}>
                        <InternalLink _hover={{ color: 'cyan.700' }} href={`/archives/${month}`}>
                            <Text fontWeight="medium">{getMonthHeading(month)}</Text>
                        </InternalLink>
                    </Box>
                ))}
            </SimpleGrid>
        </Card>
    );
};

export default ArchivesIndexPage;
