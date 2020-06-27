FROM node:14-alpine

# LABEL com.github.actions.name="ESLint Action"
# LABEL com.github.actions.description="Lint your Javascript projects with inline lint error annotations on pull requests."
# LABEL com.github.actions.icon="code"
# LABEL com.github.actions.color="yellow"

RUN apt install make gcc g++ python git
COPY . /action
ENTRYPOINT ["/action/entrypoint.sh"]
