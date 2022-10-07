import { useEffect } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';

type Props = {};

const Custom404: NextPage<Props> = ({}) => {
    const router = useRouter();

    useEffect(() => {
        router.push('/');
    });

    return (
        <Box p={10}>
            <Alert status="error">
                <AlertIcon />
                <AlertTitle>Page Not Found!</AlertTitle>
                <AlertDescription>Redirecting...</AlertDescription>
            </Alert>
        </Box>
    );
};

export default Custom404;
