import { Note, NoteGraphModel } from './note-graph-model'

// TODO: wait for foam-core data model to be stable
export interface INoteGraphDataAdapter {
  toNoteGraphModel(): NoteGraphModel
}
