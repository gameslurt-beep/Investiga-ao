import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Cena} from './Cena';

const Root: React.FC = () => (
  <Composition id="nuclear10" component={Cena} durationInFrames={300} fps={30} width={1080} height={1920} />
);
registerRoot(Root);
