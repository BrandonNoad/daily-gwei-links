import type { GetStaticProps, NextPage } from 'next';

import NextHead from 'next/head';
import { Text, Link, UnorderedList, ListItem } from '@chakra-ui/react';

import Card from '../../../components/card';

const BASE_URL = process.env.BASE_URL ?? 'https://daily-gwei-links.vercel.app';
const OG_IMAGE_API_BASE_URL =
    process.env.OG_IMAGE_API_BASE_URL ?? 'https://util.softwaredeveloper.ninja';

export const getStaticProps: GetStaticProps = async () => {
    const imageUrl = new URL(`${OG_IMAGE_API_BASE_URL}/api/og/image`);
    imageUrl.search = new URLSearchParams({
        template: 'tdg',
        content: JSON.stringify({
            style: { fontSize: 36, fontWeight: 700 },
            data: ['🔍 The Daily Gwei Refuel Episode Search']
        })
    }).toString();

    return {
        props: {
            title: 'The Daily Gwei Refuel Search',
            imageUrl: imageUrl.toString()
        }
    };
};

type Props = {
    title: string;
    imageUrl: string;
};

const FramePage: NextPage<Props> = ({ title, imageUrl }) => {
    const nftCollections = [
        {
            name: 'The Daily Gwei - 1 Year Anniversary NFT',
            href: 'https://opensea.io/collection/the-daily-gwei-1-year-anniversary-nft'
        },
        {
            name: 'Bankless - The SBF vs. Erik Voorhees Debate',
            href: 'https://opensea.io/collection/bankless-the-sbf-vs-erik-voorhees-debate'
        }
    ];
    return (
        <>
            <NextHead>
                <meta property="og:title" content={title} />
                <meta property="og:image" content={imageUrl} />
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content={imageUrl} />
                <meta property="fc:frame:button:1" content="Start" />
                <meta property="fc:frame:post_url" content={`${BASE_URL}/api/frames/search`} />
            </NextHead>
            <Card px={[3, 4, 6]} py={3} color="neutral.900">
                <Text mb={1} fontWeight="semibold">
                    To use this frame, you must own one of the following NFTs:
                </Text>
                <UnorderedList>
                    {nftCollections.map(({ name, href }) => (
                        <ListItem key={href}>
                            <Link href={href} _hover={{ color: 'primary.900' }}>
                                {name}
                            </Link>
                        </ListItem>
                    ))}
                </UnorderedList>
            </Card>
        </>
    );
};

export default FramePage;
