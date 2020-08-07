import { getHeaders } from '../lib/auth';

const createTeam = (userEmail: string, teamName: string) => {
    return new Promise((resolve, reject) => {
        fetch('/api/teams', {
            method: 'post',
            headers: getHeaders(true, false),
            body: JSON.stringify({
                user: userEmail,
                name: teamName
            })
        }).then(result => result.json()).then(result => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    });
}

const getTeamByUserOwner = (ownerEmail: string) => {
    return new Promise((resolve, reject) => {
        fetch(`/api/teams/${ownerEmail}`, {
            method: 'get',
            headers: getHeaders(true, false)
        }).then((result: Response) => {
            if (result.status !== 200) { throw result }
            return result.json()
        }).then(result => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    });
}

const getTeamById = (idTeam: number) => {
    return new Promise((resolve, reject) => {
        fetch(`/api/teams/getById/${idTeam}`, {
            method: 'get',
            headers: getHeaders(true, false)
        }).then((result: Response) => {
            if (result.status !== 200) { throw result }
            return result.json();
        }).then(result => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    });
}

export {
    createTeam,
    getTeamByUserOwner,
    getTeamById
};