import Endpoint from './endpoint.js'
import Joi from 'joi'
import Validator from '../models/validator.js'

import { TrustedError } from '../error/trustedError.js'
import { Playlist } from '../models/playlist.js'
import { User } from '../models/user.js'
import { TracksList } from '../models/tracksList.js'
import { Track } from '../models/track.js'

class PlaylistEndpoint extends Endpoint {

    constructor() {
        super({
            requiresAuth: true
        })
    }

    /**
     * @api {post} /users Create Playlist 
     * @apiGroup Playlists
     * @apiDescription Endpoint for creating new playlist
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} title Playlists title (required) (Min: 3, Max: 120).
     * @apiParam {String} description Playlists description (optional) (Max: 240).
     * 
     * @apiExample json-body:
     * {
     *      "title": "This is a title",
     *      "description": "This is a description"
     * }
     * 
     * @apiSuccess (200) {String} uuid Playlists unique id
     * @apiSuccess (200) {String} title Playlists title
     * @apiSuccess (200) {String} description Playlists description
     * @apiSuccess (200) {String} creatorUUID Playlists creator unique user id
     * @apiSuccess (200) {Array} tracks Playlists list of tracks
     * @apiSuccess (200) {Timestamp} updatedAt Date of last update
     * @apiSuccess (200) {Timestamp} createdAt Date at which user was created
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *      "uuid": "d5b434c3-c287-4cbe-bb6e-26dd90b47fd3",
     *      "title": "Das ist eine Playlist",
     *      "description": "",
     *      "creatorUUID": "a495e477-2aa2-4fef-ad0c-6dbda6e59155",
     *      "tracks": "[]",
     *      "createdAt": "2020-11-13T11:25:11.000Z",
     *      "updatedAt": "2020-11-13T11:25:11.000Z"
     * }
     * 
     * @apiPermission permission.playlists.canCreate
     * @apiVersion 1.0.0
     */
    async actionCreateOne(route) {
        let title = route.req.body.title
        let description = route.req.body.description

        const validationSchema = Joi.object({
            title: Joi.string().min(3).max(120).required(),
            description: Joi.string().max(240),
        })

        let validation = await Validator.validate(validationSchema, {title, description})

        if(!validation.passed) {
            return validation.error
        }

        let playlist = await Playlist.create({
            title,
            description,
            creatorUUID: route.user.uuid
        })

        return playlist
    }

    /**
     * @api {get} /playlists/:id Get Playlist 
     * @apiGroup Playlists
     * @apiDescription Endpoint for getting playlist information
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} id Playlists unique ID.
     * 
     * @apiSuccess (200) {String} uuid Playlists unique id
     * @apiSuccess (200) {String} title Playlists title
     * @apiSuccess (200) {String} description Playlists description
     * @apiSuccess (200) {String} creatorUUID Playlists creator unique user id
     * @apiSuccess (200) {Array} tracks Playlists list of tracks
     * @apiSuccess (200) {Timestamp} updatedAt Date of last update
     * @apiSuccess (200) {Timestamp} createdAt Date at which user was created
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *      "uuid": "d5b434c3-c287-4cbe-bb6e-26dd90b47fd3",
     *      "title": "Das ist eine Playlist",
     *      "description": "",
     *      "creatorUUID": "a495e477-2aa2-4fef-ad0c-6dbda6e59155",
     *      "tracks": "[]",
     *      "createdAt": "2020-11-13T11:25:11.000Z",
     *      "updatedAt": "2020-11-13T11:25:11.000Z"
     * }
     * 
     * @apiError 404 The requested playlist was not found.
     * @apiPermission permission.playlists.seePrivate (Optional to see non public playlists)
     * @apiVersion 1.0.0
     */
    async actionGetOne(route) {
        let id = route.params.id

        // Specify what to return
        let options = {
            attributes: ['uuid', 'title', 'description', 'createdAt', 'updatedAt', 'isPublic'],
            include: [
                {model: User, as: 'creator', attributes: ['uuid', 'username']},
                {model: TracksList, as: 'tracks', attributes: ['trackUUID'], include: [
                    {model: Track, as: 'track', attributes: ['uuid', 'title', 'artist', 'createdAt']}
                ]}
            ]
        }

        // Define where clause
        let where = {
            uuid: id
        }

        // Check if user is permitted to see private playlists
        let canSeePrivate = route.isOwnResource || route.user && route.user.hasPermission('permission.playlists.seePrivate')
        if(!canSeePrivate) {
            where.isPublic = true
        }

        let playlist = await Playlist.findOne({where, ...options})

        // Better tracks formatting in list
        for(let index in playlist.tracks) {
            playlist.tracks[index] = playlist.tracks[index].track
        }

        return playlist
    }

    /**
     * @api {get} /playlists Get multiple playlists 
     * @apiGroup Playlists
     * @apiDescription Endpoint for getting multiple playlists. (Pagination available)
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} id Playlists unique ID.
     * 
     * @apiSuccess (200) {Integer} available Number of available entries in database (used to calc pages in frontend)
     * @apiSuccess (200) {Object} playlist Entry in returned array, holding a groups info
     * @apiSuccess (200) {String} playlist.uuid Playlists unique id
     * @apiSuccess (200) {String} playlist.title Playlists title
     * @apiSuccess (200) {String} playlist.description Playlists description
     * @apiSuccess (200) {String} playlist.creatorUUID Playlists creator unique user id
     * @apiSuccess (200) {Array} playlist.tracks Playlists list of tracks
     * @apiSuccess (200) {Timestamp} playlist.updatedAt Date of last update
     * @apiSuccess (200) {Timestamp} playlist.createdAt Date at which user was created
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *      "available": 1,
     *      "entries": [
     *          {
     *              "uuid": "d5b434c3-c287-4cbe-bb6e-26dd90b47fd3",
     *              "title": "Das ist eine Playlist",
     *              "description": "",
     *              "creatorUUID": "a495e477-2aa2-4fef-ad0c-6dbda6e59155",
     *              "tracks": "[]",
     *              "createdAt": "2020-11-13T11:25:11.000Z",
     *              "updatedAt": "2020-11-13T11:25:11.000Z"
     *          }
     *      ]
     * }
     * 
     * @apiVersion 1.0.0
     */
    async actionGetMultiple(route) {
        let offset = route.req.body.offset || 0
        let limit = route.req.body.limit || 1

        if(offset < 0) offset = 0
        if(limit > 30 || limit < 1) limit = 30

        // Specify what to return
        let options = {
            offset: offset,
            limit: limit,
            attributes: ['uuid', 'title', 'description', 'createdAt', 'updatedAt', 'isPublic'],
            include: [
                {model: User, as: 'creator', attributes: ['uuid', 'username']},
                {model: TracksList, as: 'tracks', attributes: ['trackUUID'], include: [
                    {model: Track, as: 'track', attributes: ['uuid', 'title', 'artist', 'createdAt']}
                ]}
            ]
        }

        // Define where clause
        let where = {}

        // Check if user is permitted to see private playlists
        let canSeePrivate = route.user && route.user.hasPermission('permission.playlists.seePrivate')
        if(!canSeePrivate) {
            where.isPublic = true
        }

        let playlists = await Playlist.findAll({ where, ...options })

        // Better tracks formatting in list
        for(let plIndex in playlists) {
            let playlist = playlists[plIndex]

            for(let index in playlist.tracks) {
                playlist.tracks[index] = playlist.tracks[index].track
            }

            playlists[plIndex] = playlist
        }

        // Output
        let availableCount = await Playlist.findAndCountAll({ where: {}})
        return { available: availableCount.count, entries: playlists }
    }

    /**
     * @api {get} /playlists/@user/:id Get playlists of specific user 
     * @apiGroup Playlists
     * @apiDescription Endpoint for getting multiple playlists of a specific user. (Pagination available)
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} id Users unique ID.
     * 
     * @apiSuccess (200) {Integer} available Number of available entries in database (used to calc pages in frontend)
     * @apiSuccess (200) {Object} playlist Entry in returned array, holding a groups info
     * @apiSuccess (200) {String} playlist.uuid Playlists unique id
     * @apiSuccess (200) {String} playlist.title Playlists title
     * @apiSuccess (200) {String} playlist.description Playlists description
     * @apiSuccess (200) {String} playlist.creatorUUID Playlists creator unique user id
     * @apiSuccess (200) {Array} playlist.tracks Playlists list of tracks
     * @apiSuccess (200) {Timestamp} playlist.updatedAt Date of last update
     * @apiSuccess (200) {Timestamp} playlist.createdAt Date at which user was created
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *      "available": 1,
     *      "entries": [
     *          {
     *              "uuid": "d5b434c3-c287-4cbe-bb6e-26dd90b47fd3",
     *              "title": "Das ist eine Playlist",
     *              "description": "",
     *              "creatorUUID": "a495e477-2aa2-4fef-ad0c-6dbda6e59155",
     *              "tracks": "[]",
     *              "createdAt": "2020-11-13T11:25:11.000Z",
     *              "updatedAt": "2020-11-13T11:25:11.000Z"
     *          }
     *      ]
     * }
     * 
     * @apiVersion 1.0.0
     */
    async actionGetByUser(route) {
        let id = route.params.id

        let offset = route.req.body.offset || 0
        let limit = route.req.body.limit || 1

        if(offset < 0) offset = 0
        if(limit > 30 || limit < 1) limit = 30

        // Refactor @me scope to actual id
        if(id == '@me') {
            if(!route.user) return TrustedError.get("API_AUTH_REQUIRED")
            id = route.user.uuid
        }

        // Specify what to return
        let options = {
            offset: offset,
            limit: limit,
            attributes: ['uuid', 'title', 'description', 'createdAt', 'updatedAt', 'isPublic'],
            include: [
                {model: User, as: 'creator', attributes: ['uuid', 'username']},
                {model: TracksList, as: 'tracks', attributes: ['trackUUID'], include: [
                    {model: Track, as: 'track', attributes: ['uuid', 'title', 'artist', 'createdAt']}
                ]}
            ]
        }

        // Define where clause
        let where = {
            creatorUUID: id
        }

        // Check if user is permitted to see private playlists
        let canSeePrivate = route.isOwnResource || route.user && route.user.hasPermission('permission.playlists.seePrivate')
        if(!canSeePrivate) {
            where.isPublic = true
        }

        let playlists = await Playlist.findAll({ where, ...options })

        // Better formatting tracks in list
        for(let plIndex in playlists) {
            let playlist = playlists[plIndex]

            for(let index in playlist.tracks) {
                playlist.tracks[index] = playlist.tracks[index].track
            }

            playlists[plIndex] = playlist
        }

        // Output
        let availableCount = await Playlist.findAndCountAll({ where: {} })
        return { available: availableCount.count, entries: playlists }
    }

    /**
     * @api {delete} /playlists/:id Delete Playlist
     * @apiGroup Playlists
     * @apiDescription Endpoint for deleting a playlist
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * @apiParam {String} id Playlists unique id
     *
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {}
     * 
     * @apiPermission permission.playlists.canDelete
     * @apiVersion 1.0.0
     */
    async actionRemoveOne(route) {
        let id = route.params.id
        let result = result = await Playlist.destroy({where: { uuid: id }})

        if(result != 1) {
            return TrustedError.get("API_RESOURCE_NOT_DELETED")
        }

        return {}
    }

    /**
     * @api {put} /playlists/:id Update Playlist
     * @apiGroup Playlists
     * @apiDescription Endpoint for updating playlists info (not tracks).
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} id Playlists unique ID.
     * @apiParam {String} title Playlists updated title.
     * @apiParam {String} description Playlists updated description.
     * 
     * @apiExample json-body:
     * {
     *      "title": "This is a title",
     *      "description": "This is a description"
     * }
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {}
     * 
     * @apiPermission permission.playlists.canUpdate
     * @apiVersion 1.0.0
     */
    async actionUpdateOne(route) {
        let id = route.params.id
        let title = route.req.body.title
        let description = route.req.body.description

        const validationSchema = Joi.object({
            title: Joi.string().alphanum().min(3).max(120),
            description: Joi.number().min(0).max(240),
        })

        let validator = await Validator.validate(validationSchema, {title, description})

        if(!validator.passed) {
            return validator.error
        }

        let exists = await Playlist.findAll({ where: { uuid: id }})
        if(!exists) {
            return TrustedError.get("API_RESOURCE_NOT_FOUND")
        }

        await Playlist.update({title, description}, { where: { uuid: id }})
        return {}
    }

    /**
     * @api {patch} /playlists/:id Add Track to playlist
     * @apiGroup Playlists
     * @apiDescription Endpoint for adding tracks to a playlist.
     * 
     * @apiHeader {String} Authorization Users Bearer Token (JWT)
     * 
     * @apiParam {String} id Playlists unique ID.
     * @apiParam {String} trackUUID Tracks unique ID that needs to be added.
     * 
     * @apiExample json-body:
     * {
     *      "trackUUID": "d5b434c3-c287-4cbe-bb6e-26dd90b47fd3",
     * }
     * 
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {}
     * 
     * @apiPermission permission.playlists.canPatch
     * @apiVersion 1.0.0
     */
    async actionPatchOne(route) {
        let id = route.params.id
        let trackUUID = route.req.body.trackUUID

        let exists = await Playlist.findOne({ where: { uuid: id }})
        if(!exists) {
            return TrustedError.get("API_RESOURCE_NOT_FOUND")
        }

        exists = await Track.findOne({ where: { uuid: trackUUID }})
        if(!exists) {
            return TrustedError.get("API_TRACK_NOT_FOUND")
        }

        exists = await TracksList.findOne({ where: { playlistUUID: id, trackUUID}})
        if(exists) {
            return TrustedError.get("API_TRACK_IN_PLAYLIST")
        }
        
        return await TracksList.create({
            playlistUUID: id,
            trackUUID
        })
    }

}

export default new PlaylistEndpoint();