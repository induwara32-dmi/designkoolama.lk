export function shouldExposeSwagger(nodeEnvironment: string | undefined, explicitlyEnabled: boolean | undefined) {
  return nodeEnvironment !== "production" || explicitlyEnabled === true;
}
