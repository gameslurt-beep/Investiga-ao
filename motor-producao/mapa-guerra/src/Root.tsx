import React from 'react';
import {Composition} from 'remotion';
import {Guerra, GUERRA_LEN} from './Guerra';

export const Root: React.FC = () => (
  <Composition id="Guerra" component={Guerra} durationInFrames={GUERRA_LEN} fps={30} width={1080} height={1920} />
);
