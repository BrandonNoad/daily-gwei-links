import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { Link, Button } from '@chakra-ui/react';

type Props = {
    href: string;
    label: string;
};

const NavButtonLink = ({ href, label }: Props) => {
    const router = useRouter();

    const color =
        router.asPath.toLowerCase().indexOf(href.toLowerCase()) === 0
            ? { default: 'cyan.700', hover: 'cyan.800' }
            : { default: 'gray.800', hover: 'gray.900' };

    return (
        <NextLink href={href} passHref>
            <Button
                variant="ghost"
                as={Link}
                color={color.default}
                _hover={{ textDecoration: 'none', bg: 'gray.50', color: color.hover }}
                textDecoration="none"
            >
                {label}
            </Button>
        </NextLink>
    );
};

export default NavButtonLink;
