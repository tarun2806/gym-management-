import {
    collection,
    getCountFromServer,
    query,
    where,
    type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Tenant scope applied to business-collection queries. When `orgId` is
 * null the query is unscoped — that path exists only for legacy single-tenant
 * data (users with no organization memberships). Services never filter
 * organizations client-side.
 */
export interface Scope {
    orgId?: string | null;
    branchId?: string | null;
}

const scopeConstraints = (scope?: Scope): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];
    if (scope?.orgId) constraints.push(where('org_id', '==', scope.orgId));
    if (scope?.branchId) constraints.push(where('branch_id', '==', scope.branchId));
    return constraints;
};

export type Entity<T> = T & { id: string };

/**
 * Firestore count helper — still used by Dashboard while it reads directly
 * from Firestore. CRUD helpers were removed when services moved to the REST
 * API (M5); pages still on Firestore use the SDK directly.
 */
export async function countScoped(
    name: string,
    scope?: Scope,
    ...extra: QueryConstraint[]
): Promise<number> {
    const snap = await getCountFromServer(query(collection(db, name), ...scopeConstraints(scope), ...extra));
    return snap.data().count;
}
