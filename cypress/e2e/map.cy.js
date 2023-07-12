describe('Map Component', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display general information', () => {
    cy.get('.general h3').should('have.text', 'General information')
    cy.get('.general p').eq(0).should('contain.text', 'Each blue circle correspond to a counting station')
    cy.get('.general p').eq(1).should('contain.text', 'There are currently 0 counting stations.')
  })

  it('should toggle trip planner', () => {
    cy.get('.btn').eq(0).should('have.class', 'btn-secondary')
    cy.get('.btn').eq(0).click()
    cy.get('.btn').eq(0).should('have.class', 'btn-primary')
  })

  it('should toggle current traffic', () => {
    cy.get('.btn').eq(2).should('have.class', 'btn-secondary')
    cy.get('.btn').eq(2).click()
    cy.get('.btn').eq(2).should('have.class', 'btn-primary')
  })

  it('should select date and time for trip prediction', () => {
    cy.get('.trip input[type="date"]').type('2023-07-12')
    cy.get('.trip input[type="time"]').type('12:00')
    cy.get('.trip input[type="date"]').should('have.value', '2023-07-12')
    cy.get('.trip input[type="time"]').should('have.value', '12:00')
  })
})