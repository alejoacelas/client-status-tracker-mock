import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { agency, type ClientPage } from '../data/statusData'
import { href } from '../lib/router'
import { feedXml } from '../lib/feed'

type Tab = 'email' | 'sms' | 'webhook' | 'support' | 'atom'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'email', icon: 'fa-envelope', label: 'Subscribe via email' },
  { id: 'sms', icon: 'fa-phone', label: 'Subscribe via SMS' },
  { id: 'webhook', icon: 'fa-code', label: 'Subscribe via webhook' },
  { id: 'support', icon: 'fa-comment', label: 'Contact support' },
  { id: 'atom', icon: 'fa-rss', label: 'Subscribe via RSS' },
]

const COUNTRIES = [
  'United Kingdom (+44)',
  'Ireland (+353)',
  'United States (+1)',
  'Canada (+1)',
  'France (+33)',
  'Germany (+49)',
  'Netherlands (+31)',
  'Spain (+34)',
  'Australia (+61)',
  'India (+91)',
]

export function PlaceholderLogo({ page }: { page?: ClientPage }) {
  return (
    <a className="placeholder-logo" href={href(page ? page.key : '')} aria-label={`${agency.name} home`}>
      <span className="mark" aria-hidden="true">
        {agency.shortMark}
      </span>
      <span className="words">
        <span className="agency">{agency.name}</span>
        <span className="client">{page ? `${page.name} project status` : 'Client project status'}</span>
      </span>
    </a>
  )
}

function SubscribeDropdown({ page }: { page?: ClientPage }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('email')
  const [done, setDone] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const who = agency.name

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const feedUrl = useMemo(
    () => (page ? URL.createObjectURL(new Blob([feedXml(page)], { type: 'application/xml' })) : '#'),
    [page],
  )

  const submit = (msg: string) => (e: FormEvent) => {
    e.preventDefault()
    setDone(msg)
  }

  const pick = (t: Tab) => {
    setTab(t)
    setDone(null)
  }

  return (
    <div className="updates-dropdown-container" ref={ref}>
      <a
        href="#"
        className="show-updates-dropdown"
        role="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault()
          setOpen((o) => !o)
          setTab('email')
          setDone(null)
        }}
      >
        <span className="subscribe-text-full">Subscribe to Updates</span>
        <span className="subscribe-text-short">Subscribe</span>
      </a>
      {open && (
        <div className="updates-dropdown" role="dialog" aria-label="Subscribe to updates">
          <div className="updates-dropdown-nav" role="tablist">
            {TABS.filter((t) => page || t.id !== 'atom').map((t) => (
              <a
                key={t.id}
                href={`#updates-dropdown-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-label={t.label}
                className={tab === t.id ? 'active' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  pick(t.id)
                }}
              >
                <i className={`fa ${t.icon}`} aria-hidden="true" />
              </a>
            ))}
            <button className="close" aria-label="Close subscribe form" onClick={() => setOpen(false)}>
              x
            </button>
          </div>

          {done ? (
            <div className="updates-dropdown-section">
              <div className="subscribe-confirmation">
                <i className="fa fa-check-circle" aria-hidden="true" />
                {done}
              </div>
            </div>
          ) : (
            <>
              {tab === 'email' && (
                <div className="updates-dropdown-section email" role="tabpanel">
                  <div className="directions">
                    Get email notifications whenever {who} <strong>creates</strong>, <strong>updates</strong> or{' '}
                    <strong>resolves</strong> an incident.
                  </div>
                  <form onSubmit={submit('Check your inbox to confirm your subscription. (Mock: nothing was sent.)')}>
                    <label htmlFor="email">Email address:</label>
                    <input id="email" name="email" type="text" className="full-width" autoComplete="email" required />
                    <input type="submit" value="Subscribe via Email" className="flat-button full-width" />
                    <div className="terms_and_privacy_information">
                      By subscribing you agree to the {who} <a href="#">Privacy Policy</a>.
                    </div>
                  </form>
                </div>
              )}

              {tab === 'sms' && (
                <div className="updates-dropdown-section phone" role="tabpanel">
                  <div className="directions">
                    Get text message notifications whenever {who} <strong>creates</strong> or{' '}
                    <strong>resolves</strong> an incident.
                  </div>
                  <form onSubmit={submit('We have sent a confirmation code to your phone. (Mock: nothing was sent.)')}>
                    <div className="control-group">
                      <label htmlFor="phone-country">Country code:</label>
                      <div className="select-wrapper">
                        <select id="phone-country" defaultValue={COUNTRIES[0]}>
                          {COUNTRIES.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <label htmlFor="phone-number">Phone number:</label>
                      <input id="phone-number" type="text" className="full-width" required />
                    </div>
                    <input type="submit" value="Subscribe via Text Message" className="flat-button full-width" />
                    <div className="terms_and_privacy_information">
                      Message and data rates may apply. By subscribing you agree to the {who}{' '}
                      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                    </div>
                  </form>
                </div>
              )}

              {tab === 'webhook' && (
                <div className="updates-dropdown-section webhook" role="tabpanel">
                  <div className="directions">
                    Get webhook notifications whenever {who} <strong>creates</strong> an incident,{' '}
                    <strong>updates</strong> an incident, <strong>resolves</strong> an incident or{' '}
                    <strong>changes</strong> a component status.
                  </div>
                  <form onSubmit={submit('Webhook added. (Mock: nothing will be sent.)')}>
                    <div className="control-group">
                      <label htmlFor="endpoint-webhooks">Webhook URL:</label>
                      <input id="endpoint-webhooks" type="text" className="full-width" required />
                      <p className="help-block">The URL we should send the webhooks to</p>
                    </div>
                    <div className="control-group">
                      <label htmlFor="email-webhooks">Email address:</label>
                      <input id="email-webhooks" type="text" className="full-width" required />
                      <p className="help-block">We'll send you email if your endpoint fails</p>
                    </div>
                    <input type="submit" value="Subscribe To Notifications" className="flat-button full-width" />
                  </form>
                </div>
              )}

              {tab === 'support' && (
                <div className="updates-dropdown-section support" role="tabpanel">
                  Visit our <a href={`mailto:${agency.supportEmail}`}>support site</a>.
                </div>
              )}

              {tab === 'atom' && (
                <div className="updates-dropdown-section atom" role="tabpanel">
                  Get the{' '}
                  <a href={feedUrl} target="_blank" rel="noreferrer">
                    Atom Feed
                  </a>{' '}
                  or{' '}
                  <a href={feedUrl} target="_blank" rel="noreferrer">
                    RSS Feed
                  </a>
                  .
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function Masthead({ page }: { page?: ClientPage }) {
  return (
    <div className="masthead-container basic">
      <div className="masthead has-logo clearfix">
        <div className="logo-container">
          <PlaceholderLogo page={page} />
        </div>
        <SubscribeDropdown page={page} />
      </div>
    </div>
  )
}
