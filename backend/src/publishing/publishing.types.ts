export const publishableResources=["pages","services","portfolio","packages","testimonials"] as const;
export type PublishableResource=typeof publishableResources[number];
