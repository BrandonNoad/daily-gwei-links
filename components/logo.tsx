import { Box } from '@chakra-ui/react';
import { Image, Transformation } from 'cloudinary-react';

import InternalLink from './internalLink';

const Logo = () => (
    <Box width="36px">
        <InternalLink href="/">
            <Image secure cloudName="noad" publicId="cap_hr9yu9.png" alt="logo">
                <Transformation quality="auto" fetchFormat="auto" />
            </Image>
        </InternalLink>
    </Box>
);

export default Logo;
