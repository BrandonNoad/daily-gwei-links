import { Box } from '@chakra-ui/react';

type Props = {
    children: React.ReactNode;
    [rest: string]: any;
};

const Card = ({ children, ...rest }: Props) => (
    <Box
        bg="white"
        borderRadius="md"
        boxShadow="md"
        borderWidth="1px"
        borderColor="gray.300"
        _hover={{ borderColor: 'gray.400' }}
        {...rest}
    >
        {children}
    </Box>
);

export default Card;
