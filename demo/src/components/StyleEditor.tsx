import React from 'react'
import { useDebouncedFn } from 'beautiful-react-hooks'
import { useForm } from 'react-hook-form'
import { RecursivePartial, mergeObjects } from '../../../src/util'
import { GraphViewStyle, getDefaultColorOf } from '../note-graph'
import './style-editor.css'

export function getByPath(obj, path: string | string[], defval = null) {
  const segs = typeof path === 'string' ? (path.split('.')) : path
  return segs.reduce((xs, x) => (xs && xs[x] ? xs[x] : defval), obj)
}

type Props = {
  style: RecursivePartial<GraphViewStyle>
  onChange(style: RecursivePartial<GraphViewStyle>): void
}

const StyleEditor = (props: Props) => {
  const style: RecursivePartial<GraphViewStyle> = mergeObjects<
    RecursivePartial<GraphViewStyle>
  >(
    getDefaultColorOf({}),
    props.style
  )
  const { register, handleSubmit } = useForm({
    defaultValues: style,
  })
  const onSubmit = (data) => {
    debouncedOnchange(data)
  }

  const debouncedOnchange = useDebouncedFn((s) => {
    console.log('debounced emit change', s)
    props.onChange(s)
  }, 300)

  const fields = [
    { name: 'background', type: 'color' },
    { name: 'highlightedForeground', type: 'color' },
    { name: 'node.note.regular', type: 'color' },
    { name: 'link.regular', type: 'color' },
    { name: 'link.highlighted', type: 'color' },
    { name: 'hoverNodeLink.highlightedDirection.inbound', type: 'color' },
    { name: 'hoverNodeLink.highlightedDirection.outbound', type: 'color' },
    // { name: 'fontSize', type: 'number' },
  ]

  return (
    <div className="style-editor">
      <form onChange={handleSubmit(onSubmit)}>
        {fields.map((field) => {
          const { name, type } = field
          const propPath = name
          return (
            <div key={name} className="style-editor__field">
              <label>{name}</label>
              <input
                type={type}
                name={name}
                {...register(name as any)}
              />
              <span>{getByPath(style, propPath)}</span>
            </div>
          )
        })}
      </form>
    </div>
  )
}

export default StyleEditor
