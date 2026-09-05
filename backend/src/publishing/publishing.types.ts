export const publishableResources=["pages","services","portfolio-categories","portfolio","packages","testimonials"] as const;
export type PublishableResource=typeof publishableResources[number];
