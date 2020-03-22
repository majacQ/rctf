import { Component } from 'preact'
import config from '../../../config/client'
import 'linkstate/polyfill'
import withStyles from '../components/jss'

import { privateProfile, publicProfile, deleteAccount, updateAccount } from '../api/profile'
import Form from '../components/form'
import util from '../util'
import Trophy from '../../static/icons/trophy.svg'
import AddressBook from '../../static/icons/address-book.svg'
import UserCircle from '../../static/icons/user-circle.svg'
import Rank from '../../static/icons/rank.svg'

const divisionMap = new Map()

for (const division of Object.entries(config.divisions)) {
  divisionMap.set(division[1], division[0])
}

export default withStyles({
  quote: {
    fontSize: 'small',
    overflowWrap: 'break-word'
  },
  icon: {
    '& svg': {
      verticalAlign: 'middle',
      height: '20px',
      fill: '#333'
    },
    marginRight: '25px'
  },
  form: {
    '& button': {
      margin: 0,
      lineHeight: '20px',
      padding: '10px',
      float: 'right'
    },
    padding: '0 !important'
  }
}, class Profile extends Component {
  state = {
    loaded: false,
    name: '',
    division: '',
    divisionPlace: '',
    globalPlace: '',
    score: 0,
    teamToken: '',
    solves: [],
    uuid: '',
    error: undefined,
    updateName: '',
    updateDivision: 0,
    disabledButton: false
  }

  processGeneric ({ name, division, score, divisionPlace, globalPlace, solves }) {
    this.setState({
      name,
      updateName: name,
      division: divisionMap.get(division),
      updateDivision: division,
      divisionPlace: util.strings.placementString(divisionPlace),
      globalPlace: util.strings.placementString(globalPlace),
      score,
      solves,
      loaded: true
    })
  }

  componentDidMount () {
    document.title = `Profile${config.ctfTitle}`
  }

  isPrivate () {
    const { uuid } = this.props

    return uuid === undefined || uuid === 'me'
  }

  static getDerivedStateFromProps(props, state) {
    if (props.uuid !== state.uuid) {
      return {
        uuid: props.uuid,
        error: undefined,
        loaded: false
      }
    }
    return null
  }

  componentDidUpdate () {
    if (!this.state.loaded) {
      const { uuid } = this.state;

      if (this.isPrivate()) {
        privateProfile()
          .then(data => {
            this.processGeneric(data)
            this.setState({
              teamToken: data.teamToken
            })
          })
      } else {
        publicProfile(uuid)
          .then(data => {
            if (data === null) {
              this.setState({
                error: 'Profile not found',
                loaded: true
              })
            } else {
              this.processGeneric(data)
            }
          })
      }
    }
  }

  handleUpdate = e => {
    e.preventDefault()

    this.setState({
      disabledButton: true
    })

    updateAccount(this.state.updateName, this.state.updateDivision)
      .then(resp => {
        this.setState({
          disabledButton: false
        })

        if (resp) {
          this.setState({
            name: resp.user.name,
            division: divisionMap.get(Number.parseInt(resp.user.division))
          })
        }
      })
  }

  handleDelete = () => {
    const resp = prompt(`Please type your team name to confirm: ${this.state.name}`)

    if (resp === this.state.name) {
      deleteAccount()
    }
  }

  render ({ classes }, { name, division, divisionPlace, globalPlace, score, teamToken, solves, error, loaded, updateName, updateDivision, disabledButton }) {
    const priv = this.isPrivate()
    const hasError = error !== undefined

    if (!loaded) return null

    if (hasError) {
      return (
        <div class='row u-center' style='align-items: initial !important'>
          <div class='col-4'>
            <div class='card u-flex u-flex-column'>
              <div class='content'>
                <p class='title'>There was an error</p>
                <p class='font-thin'>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div class='row u-center' style='align-items: initial !important'>
        {
          priv &&
            <div class='col-4'>
              <div class='card u-flex u-flex-column'>
                <div class='content'>
                  <p>Team Code</p>
                  <blockquote class={classes.quote}>
                    {teamToken}
                  </blockquote>
                  <p class='font-thin'>Share this with your teammates to use at <a href='/login'>/login</a>!</p>
                </div>
              </div>
              <div class='card u-flex u-flex-column'>
                <div class='content'>
                  <p style='margin-bottom: 0'>Update Information</p>
                  <p class='font-thin u-no-margin'>Warning: You can only do this once per 10 minutes</p>
                  <div class='row u-center'>
                    <Form class={`col-12 ${classes.form}`} onSubmit={this.handleUpdate} disabled={disabledButton} buttonText='Update'>
                      <input autofocus required icon={<UserCircle />} name='name' placeholder='Team Name' type='text' value={updateName} onChange={this.linkState('updateName')} />
                      <select required class='select' name='division' value={updateDivision} onChange={this.linkState('updateDivision')}>
                        <option value='' disabled selected>Division</option>
                        {
                          Object.entries(config.divisions).map(([name, code]) => {
                            return <option key={code} value={code}>{name}</option>
                          })
                        }
                      </select>
                    </Form>
                  </div>
                  <div class='u-center action-bar' style='margin: 0.5rem; padding: 1rem'>
                    <button class='btn-small btn-danger outline' style='border-color: var(--btn-color)' onClick={this.handleDelete}>Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
        }
        <div class='col-6'>
          <div class='card u-flex u-flex-column'>
            <div class='content'>
              <h5 class='title' style='text-overflow: ellipsis; overflow: hidden;'>{name}</h5>
              <div class='action-bar'>
                <p>
                  <span class={`icon ${classes.icon}`}>
                    <Trophy />
                  </span>
                  {
                    score === 0
                      ? ('No points earned')
                      : (`${score} total points`)
                  }
                </p>
                <p>
                  <span class={`icon ${classes.icon}`}>
                    <Rank />
                  </span>
                  {
                    score === 0 ? 'Unranked' : `${divisionPlace} in the ${division} division`
                  }
                </p>
                <p>
                  <span class={`icon ${classes.icon}`}>
                    <Rank />
                  </span>
                  {
                    score === 0 ? 'Unranked' : `${globalPlace} across all teams`
                  }
                </p>
                <p>
                  <span class={`icon ${classes.icon}`}>
                    <AddressBook />
                  </span>
                  {division} division
                </p>
              </div>
            </div>
          </div>

          {
            solves.length !== 0 &&
              <div class='card u-flex u-flex-column'>
                <div class='content'>
                  <h5 class='title u-text-center'>Solves</h5>
                  <table class='table borderless'>
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Name</th>
                        <th>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solves.map(solve => <tr key={solve.name}><td>{solve.category}</td><td>{solve.name}</td><td>{solve.points}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
          }

        </div>
      </div>
    )
  }
})
