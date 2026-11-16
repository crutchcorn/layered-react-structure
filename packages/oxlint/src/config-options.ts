type StructureIgnorePatterns = string | (string | string[])[]

/** Options for the application file and folder structure policy. */
export interface StructureConfigOptions {
  /** Absolute path to the application directory containing `src`. */
  root: string
  /** Paths ignored only by the folder-structure check. */
  ignorePatterns?: StructureIgnorePatterns
}
