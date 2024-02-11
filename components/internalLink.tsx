import NextLink from 'next/link';
import { Link } from '@chakra-ui/react';

type Props = {
    href: string;
    children: React.ReactNode;
    [rest: string]: any;
};

const InternalLink = ({ href, ...rest }: Props) => <Link as={NextLink} href={href} {...rest} />;

export default InternalLink;
