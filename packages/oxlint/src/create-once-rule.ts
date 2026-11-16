/** Keep the existing ESLint and TypeScript AST types for shared rules. */
export type CreateOnceRule<Module extends { create(context: never): object }> =
  Omit<Module, 'create'> & {
    createOnce(
      context: Parameters<Module['create']>[0],
    ): ReturnType<Module['create']> & { before?(): boolean | void }
  }
