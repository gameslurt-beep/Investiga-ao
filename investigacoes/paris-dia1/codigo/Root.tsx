import React from 'react';
import {Composition} from 'remotion';
import {Scene} from './Scene';
import {Scene2} from './Scene2';
export const Root: React.FC = () => (
  <>
    <Composition id="Apartamento" component={Scene} width={720} height={1280} fps={30} durationInFrames={150} />
    <Composition id="Apartamento2" component={Scene2} width={720} height={1280} fps={30} durationInFrames={150} />
  </>
);
