import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {FPS,TOTAL_FRAMES} from './config';
export const Root=()=> <Composition id="TrishulReel" component={Reel} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES}/>;
