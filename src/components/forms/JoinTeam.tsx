import React from 'react';
import history from '../../lib/history';
import { getHeaders } from '../../lib/auth';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Props {
    match: any
}

interface State {}

class JoinTeam extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.joinToTheTeam(this.props.match.params.token);
    }

    joinToTheTeam(token) {
        fetch('/api/team-invitation', {
            method: 'POST',
            headers: getHeaders(false, false),
            body: JSON.stringify({
                token: token
            })
          }).then(async res => {
            const data = await res.json();

            if (res.status !== 200) {
              throw new Error(data.error ? data.error : 'Error joinning to the team');
            }

            return data;

          }).then((res) => {
            toast.info("You've been joined succesfully to the team!");
            history.push('/');
          }).catch(err => {
            toast.warn(`"${err}"`);
            history.push('/');
          });
    }

    render() {
        return(<div />)
    }
}

export default JoinTeam;