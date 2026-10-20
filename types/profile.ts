export type Profile = {
	id: number;
	name: string;
	age: number;
	bio: string;
	interests: string[];
	image?: string;
	mutualLike?: boolean;
};
