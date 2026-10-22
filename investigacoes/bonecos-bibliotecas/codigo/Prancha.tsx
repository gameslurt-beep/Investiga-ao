// Mesma sala, boneco tirado de bibliotecas prontas (não desenhado à mão)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import Peep from 'react-peeps';
import {BigHead} from '@bigheads/core';
import {createAvatar} from '@dicebear/core';
import * as col from '@dicebear/collection';
import {W, H, Vinheta, Casa, Legenda} from './kit';

const Sala: React.FC = () => (
  <svg width={W} height={H} style={{position: 'absolute'}}>
    <rect width={W} height={1058} fill="#e6d4b4" />
    <rect y={1046} width={W} height={18} fill="#efe2c8" />
    <rect y={1064} width={W} height={540} fill="#c8b28c" />
    <rect y={1600} width={W} height={H - 1600} fill="#62432c" />
    <rect x={228} y={312} width={636} height={532} fill="#f3ead8" />
    <rect x={250} y={334} width={592} height={488} fill="#d9a76d" />
    <Casa x={250} base={760} w={240} h={260} telhado="#a7463a" parede="#e9d3ad" janela="#c9d1d6" />
    <Casa x={560} base={760} w={260} h={250} telhado="#566f93" parede="#cfdad6" janela="#f0dd9a" />
    <rect x={250} y={700} width={592} height={60} fill="#8b9377" />
    <rect x={250} y={760} width={592} height={62} fill="#5f6a5c" />
    <rect x={536} y={334} width={20} height={488} fill="#f3ead8" />
    <rect x={210} y={832} width={672} height={22} fill="#efe4cf" />
    <rect x={700} y={1395} width={420} height={120} rx={30} fill="#8a6352" />
    <rect x={670} y={1480} width={440} height={120} rx={26} fill="#7a5545" />
  </svg>
);

const dice = (style: any, opts: any) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(createAvatar(style, {seed: 'Rafa', ...opts}).toString());

// Busto: em close, como os planos "olhando por cima do muro" do original
const Busto: React.FC<{src: string; size?: number; y?: number}> = ({src, size = 760, y = 860}) => (
  <img src={src} style={{position: 'absolute', width: size, height: size, left: (W - size) / 2, top: y}} />
);

const HAIR = ['6a4426'];
const SKIN = ['f2d4b0'];

export const MODELOS: {nome: string; lib: string; lic: string; el: React.ReactNode}[] = [
  {
    nome: 'Open Peeps', lib: 'react-peeps', lic: 'CC0 / MIT',
    el: (
      <div style={{position: 'absolute', left: 90, top: 760, width: 620, height: 1000}}>
        <Peep style={{width: 620, height: 1000}} body="ShirtPantsWB" face="Concerned" hair="ShortVolumed" strokeColor="#2a1d14" backgroundColor="#ffffff" viewBox={{x: '0', y: '0', width: '1050', height: '1900'}} />
      </div>
    ),
  },
  {
    nome: 'Big Heads', lib: '@bigheads/core', lic: 'MIT',
    el: (
      <div style={{position: 'absolute', left: 140, top: 820, width: 800, height: 800}}>
        <BigHead accessory="none" body="chest" circleColor="blue" clothing="shirt" clothingColor="green" eyebrows="serious" eyes="normal" faceMask={false} facialHair="none" graphic="none" hair="short" hairColor="brown" hat="none" lashes={false} lipColor="pink" mask={false} mouth="serious" skinTone="light" />
      </div>
    ),
  },
  {nome: 'Avataaars', lib: 'DiceBear', lic: 'Livre (Pablo Stanley)', el: <Busto src={dice(col.avataaars, {top: ['shortCurly'], hairColor: HAIR, skinColor: SKIN, clothing: ['hoodie'], clothesColor: ['5d6b3f'], eyebrows: ['angryNatural'], mouth: ['serious'], eyes: ['default'], accessoriesProbability: 0, facialHairProbability: 0})} />},
  {nome: 'Personas', lib: 'DiceBear', lic: 'CC BY 4.0', el: <Busto src={dice(col.personas, {hair: ['curly'], hairColor: HAIR, skinColor: ['e5a07e'], clothingColor: ['5d6b3f'], mouth: ['smirk'], facialHairProbability: 0})} />},
  {nome: 'Notionists', lib: 'DiceBear', lic: 'CC0', el: <Busto src={dice(col.notionists, {backgroundColor: ['transparent'], beardProbability: 0, glassesProbability: 0, gestureProbability: 0})} />},
  {nome: 'Micah', lib: 'DiceBear', lic: 'CC BY 4.0', el: <Busto src={dice(col.micah, {hair: ['fonze'], hairColor: ['6a4426'], baseColor: ['f9c9b6'], shirtColor: ['5d6b3f'], mouth: ['nervous'], facialHairProbability: 0, glassesProbability: 0, earringsProbability: 0})} />},
  {nome: 'Adventurer', lib: 'DiceBear', lic: 'CC BY 4.0', el: <Busto src={dice(col.adventurer, {hair: ['short05'], hairColor: ['6a4426'], skinColor: ['f2d3b1'], glassesProbability: 0, featuresProbability: 0, earringsProbability: 0})} />},
  {nome: 'Big Smile', lib: 'DiceBear', lic: 'CC BY 4.0', el: <Busto src={dice(col.bigSmile, {hair: ['curlyShortHair'], hairColor: ['6a4426'], skinColor: ['f5d0c5'], accessoriesProbability: 0, mouth: ['unimpressed']})} />},
  {nome: 'Lorelei', lib: 'DiceBear', lic: 'CC0', el: <Busto src={dice(col.lorelei, {hair: ['variant12'], hairColor: ['6a4426'], glassesProbability: 0, earringsProbability: 0, frecklesProbability: 0, beardProbability: 0})} />},
  {nome: 'Toon Head', lib: 'DiceBear', lic: 'CC BY 4.0', el: <Busto src={dice(col.toonHead, {hair: ['spiky'], hairColor: ['6a4426'], beardProbability: 0, clothesColor: ['5d6b3f']})} />},
];

export const Prancha: React.FC<{i: number}> = ({i}) => (
  <AbsoluteFill>
    <Sala />
    {MODELOS[i].el}
    <Vinheta />
    <Legenda txt="ONDE [y]CORRER" y={1760} />
    <div style={{position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', fontFamily: 'Oswald', fontWeight: 600, fontSize: 64, color: '#2a1d14'}}>
      {i + 1}. {MODELOS[i].nome}
      <div style={{fontSize: 32, opacity: 0.7}}>{MODELOS[i].lib} · {MODELOS[i].lic}</div>
    </div>
  </AbsoluteFill>
);
