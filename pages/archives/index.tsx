import type { GetStaticProps, NextPage } from 'next';

import { SimpleGrid, Box, Text } from '@chakra-ui/react';

import InternalLink from '../../components/internalLink';
import { fetchAllVideos } from '../../util/airtable';
import { groupByMonth, getMonthHeading } from '../../util';
import Card from '../../components/card';

export const getStaticProps: GetStaticProps = async () => {
    const allVideos = await fetchAllVideos();

    const allVideosGroupedByMonth = groupByMonth(allVideos);

    return {
        props: {
            title: 'Archives',
            months: Object.keys(allVideosGroupedByMonth).sort().reverse()
        }
    };
};

type Props = {
    title: string;
    months: string[];
};

const ArchivesIndexPage: NextPage<Props> = ({ months }) => {
    return (
        <Card px={24} py={10}>
            <SimpleGrid columns={[2, null, 3]} spacingX={6} spacingY={4} justifyItems="center">
                {months.map((month) => (
                    <Box key={month}>
                        <InternalLink
                            color="primary.800"
                            _hover={{ color: 'primary.900', fontWeight: 'medium' }}
                            href={`/archives/${month}`}
                        >
                            <Text fontWeight="medium">{getMonthHeading(month)}</Text>
                        </InternalLink>
                    </Box>
                ))}
            </SimpleGrid>
        </Card>
    );
};

export default ArchivesIndexPage;
