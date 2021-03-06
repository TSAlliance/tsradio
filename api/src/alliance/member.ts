import axios from 'axios';
import config from '../config/config'
import { TrustedError } from '../error/trustedError';
import { Router } from '../router';
import { Alliance } from './alliance';

export class Member {
    public accountType: Member.AccountType = Member.AccountType.ACCOUNT_MEMBER;

    public readonly uuid: string
    public readonly name: string
    public readonly email: string
    public readonly role: Member.Role
    public readonly avatar: string

    constructor(uuid: string, name: string, email: string, role: Member.Role, avatar: string) {
        this.uuid = uuid
        this.name = name
        this.email = email
        this.role = role
        this.avatar = avatar
    }

    /**
     * Check if account is from type member
     * Returns always true for member classes
     */
    isMember() {
        return this.accountType == Member.AccountType.ACCOUNT_MEMBER
    }

    /**
     * Check if account has a specific permission
     * @param permission Permission string
     * @returns {Boolean} True or False
     */
    hasPermission(permission: String, route?: Router.Route): Boolean {
        if(!permission) return true
        if(this.role?.uuid === "*") return true
        if(route) {
            return route.isOwnResource || this.role?.permissions.includes(permission)
        } else {
            return this.role?.permissions.includes(permission)
        }
    }

    /**
     * Sign in a member account using jsonwebtoken.
     * @param token jsonwebtoken
     * @returns Member account object or TrustedError
     */
    static async signInWithToken(token: string): Promise<Member | TrustedError> {
        return Alliance.getInstance().authenticateMemberByToken(token)
    }

}

export namespace Member {
    export const enum AccountType {
        ACCOUNT_SYSTEM = 1,
        ACCOUNT_MEMBER
    }

    /**
     * Extract session token from request and authenticate requester
     * @param request Express request
     * @returns {Account} Account data or TrustedError
     */
    export async function authenticateRequest(request): Promise<Member | TrustedError> {
        let authorizationHeader = request.headers["authorization"]

        if(authorizationHeader?.startsWith("Bearer")) {
            let token = authorizationHeader.slice(7)
            return Member.signInWithToken(token)
        } else {
            return TrustedError.get(TrustedError.Errors.UNKNOWN_AUTH_METHOD)
        }
    }

    export async function findMember(targetUUID: string): Promise<TrustedError | Member> {
        return null
    }

    export class Role {
        public readonly uuid: string
        public readonly name: string
        public readonly permissions: Array<String>
        public readonly hierarchy: Number
    
        constructor(uuid: string, name: string, permissions: Array<String>, hierarchy: Number) {
            this.uuid = uuid
            this.name = name
            this.permissions = permissions
            this.hierarchy = hierarchy
        }
    }

    export class Profile {
        public readonly uuid: string
        public readonly name: string
        public readonly avatar?: string
    
        constructor(uuid: string, name: string, avatar?: string) {
            this.uuid = uuid
            this.name = name
            this.avatar = avatar
        }
    }
}