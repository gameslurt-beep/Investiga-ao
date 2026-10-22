import React from 'react';
import {Composition} from 'remotion';
import {Video, TOTAL} from './Video';
export const Root: React.FC = () => (
	<Composition id="QV" component={Video} durationInFrames={Math.round(TOTAL * 30)} fps={30} width={1080} height={1920} />
);
