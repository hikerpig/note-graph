import React from 'react';
import { RecursivePartial, mergeObjects } from '../../../src/util';
import { GraphViewStyle } from '../note-graph'

type Props = {
  style: RecursivePartial<GraphViewStyle>
  onChange(style: RecursivePartial<GraphViewStyle>): void
}

const StyleEditor = (props: Props) => {
  const style: RecursivePartial<GraphViewStyle> = mergeObjects<RecursivePartial<GraphViewStyle>>({
    background: '#fff',
  }, props.style)

  const debouncedOnchange = () => {
    props.onChange(style)
  }

  return (
    <div className="style-editor">
      <div>
        <label>Background Color:</label>
        <input type="color" value={style.background} onChange={(e) => {
          style.background = e.target.value
          debouncedOnchange()
        }} />
        <span>{style.background}</span>
      </div>
    </div>
  );
}

export default StyleEditor;
