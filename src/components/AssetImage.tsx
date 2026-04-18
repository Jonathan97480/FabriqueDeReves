/**
 * AssetImage.tsx
 * Composant image qui affiche un asset local quand disponible
 */

import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface AssetImageProps {
  source: number | null;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

const AssetImage: React.FC<AssetImageProps> = ({
  source,
  style,
  resizeMode = 'contain',
}) => {
  if (source === null) {
    return null;
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
    />
  );
};

export default AssetImage;