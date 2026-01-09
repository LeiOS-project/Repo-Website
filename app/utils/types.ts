import type { GetDevPackagesPackageNameReleasesResponses, GetDevPackagesResponses, PostDevPackagesData, PostDevPackagesPackageNameReleasesData } from "~/api-client";

export namespace UtilityTypes {

    export type SomePartial<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

}

export type DevPackage = GetDevPackagesResponses["200"]["data"][number];
export type NewDevPackage = NonNullable<PostDevPackagesData["body"]>;

export type DevPackageRelease = GetDevPackagesPackageNameReleasesResponses["200"]["data"][number];
export type NewDevPackageRelease = NonNullable<PostDevPackagesPackageNameReleasesData["body"]>;