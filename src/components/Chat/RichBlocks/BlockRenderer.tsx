import React from 'react';
import type {
  MessageBlock,
  TextBlockPayload,
  LatexBlockPayload,
  GraphBlockPayload,
  OpenUIWidgetPayload,
  ImageBlockPayload,
  CarouselBlockPayload,
  ComparisonSliderBlockPayload,
  MetricGridBlockPayload,
  TabbedDeckBlockPayload,
  ComparisonMatrixBlockPayload,
  CalculatorBlockPayload,
  RoadmapChecklistBlockPayload,
  FlowchartBlockPayload,
  AccordionBlockPayload,
  QuizBlockPayload,
} from '../../../types';
import { TextBlock } from './TextBlock';
import { LatexBlock } from './LatexBlock';
import { GraphBlock } from './GraphBlock';
import { OpenUIWidgetBlock } from './OpenUIWidgetBlock';
import { ImageBlock } from './ImageBlock';
import { CarouselBlock } from './CarouselBlock';
import { ComparisonSliderBlock } from './ComparisonSliderBlock';
import { MetricGridBlock } from './MetricGridBlock';
import { TabbedDeckBlock } from './TabbedDeckBlock';
import { ComparisonMatrixBlock } from './ComparisonMatrixBlock';
import { CalculatorBlock } from './CalculatorBlock';
import { RoadmapChecklistBlock } from './RoadmapChecklistBlock';
import { FlowchartBlock } from './FlowchartBlock';
import { AccordionBlock } from './AccordionBlock';
import { QuizCardBlock } from './QuizCardBlock';

interface BlockRendererProps {
  blocks: MessageBlock[];
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        switch (block.type) {
          case 'text':
            return (
              <TextBlock
                key={block.id}
                content={(block.payload as TextBlockPayload).markdown}
              />
            );
          case 'latex': {
            const p = block.payload as LatexBlockPayload;
            return (
              <LatexBlock
                key={block.id}
                formula={p.formula}
                displayMode={p.displayMode}
                caption={p.caption}
              />
            );
          }
          case 'graph': {
            const p = block.payload as GraphBlockPayload;
            return (
              <GraphBlock
                key={block.id}
                title={p.title}
                type={p.type}
                data={p.data}
                accentColor={p.accentColor}
              />
            );
          }
          case 'carousel': {
            const p = block.payload as CarouselBlockPayload;
            return <CarouselBlock key={block.id} title={p.title} items={p.items} />;
          }
          case 'comparison-slider': {
            const p = block.payload as ComparisonSliderBlockPayload;
            return (
              <ComparisonSliderBlock
                key={block.id}
                title={p.title}
                beforeLabel={p.beforeLabel}
                afterLabel={p.afterLabel}
                beforeText={p.beforeText}
                afterText={p.afterText}
              />
            );
          }
          case 'metric-grid': {
            const p = block.payload as MetricGridBlockPayload;
            return (
              <MetricGridBlock
                key={block.id}
                title={p.title}
                metrics={p.metrics}
              />
            );
          }
          case 'tabbed-deck': {
            const p = block.payload as TabbedDeckBlockPayload;
            return <TabbedDeckBlock key={block.id} tabs={p.tabs} />;
          }
          case 'comparison-matrix': {
            const p = block.payload as ComparisonMatrixBlockPayload;
            return (
              <ComparisonMatrixBlock
                key={block.id}
                title={p.title}
                columns={p.columns}
                features={p.features}
              />
            );
          }
          case 'calculator': {
            const p = block.payload as CalculatorBlockPayload;
            return (
              <CalculatorBlock
                key={block.id}
                title={p.title}
                formulaLabel={p.formulaLabel}
                inputs={p.inputs}
                calculationType={p.calculationType}
              />
            );
          }
          case 'roadmap-checklist': {
            const p = block.payload as RoadmapChecklistBlockPayload;
            return (
              <RoadmapChecklistBlock
                key={block.id}
                title={p.title}
                items={p.items}
              />
            );
          }
          case 'flowchart': {
            const p = block.payload as FlowchartBlockPayload;
            return (
              <FlowchartBlock
                key={block.id}
                title={p.title}
                nodes={p.nodes}
                connections={p.connections}
              />
            );
          }
          case 'accordion': {
            const p = block.payload as AccordionBlockPayload;
            return <AccordionBlock key={block.id} items={p.items} />;
          }
          case 'quiz': {
            const p = block.payload as QuizBlockPayload;
            return (
              <QuizCardBlock
                key={block.id}
                question={p.question}
                options={p.options}
                correctId={p.correctId}
                explanation={p.explanation}
                hint={p.hint}
              />
            );
          }
          case 'openui': {
            const p = block.payload as OpenUIWidgetPayload;
            return (
              <OpenUIWidgetBlock
                key={block.id}
                componentType={p.componentType}
                title={p.title}
                description={p.description}
                props={p.props}
              />
            );
          }
          case 'image': {
            const p = block.payload as ImageBlockPayload;
            return (
              <ImageBlock
                key={block.id}
                url={p.url}
                alt={p.alt}
                caption={p.caption}
              />
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
};
